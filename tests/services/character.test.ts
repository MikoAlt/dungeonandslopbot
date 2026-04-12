import { describe, it, expect, beforeEach } from 'bun:test';
import {
  CharacterService,
  type CharacterRepository,
  type CreateCharacterData,
} from '../../src/services/character.js';
import type { Character, DnD5eStats, CustomSimpleStats } from '../../src/types/character.js';
import { NotFoundError, ValidationError } from '../../src/errors.js';

function createMockRepository(): CharacterRepository {
  const characters = new Map<string, Character>();
  let idCounter = 1;

  return {
    async create(data) {
      const character: Character = {
        ...data,
        id: `char-${idCounter++}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      characters.set(character.id, character);
      return character;
    },
    async findById(id) {
      return characters.get(id) ?? null;
    },
    async findByUserId(userId) {
      return Array.from(characters.values()).filter((c) => c.userId === userId);
    },
    async update(id, data) {
      const character = characters.get(id);
      if (!character) throw new NotFoundError('Character', id);
      const updated = { ...character, ...data, updatedAt: new Date() };
      characters.set(id, updated);
      return updated;
    },
    async delete(id) {
      characters.delete(id);
    },
  };
}

const validDnd5eStats: DnD5eStats = {
  str: 16,
  dex: 14,
  con: 12,
  int: 10,
  wis: 13,
  cha: 8,
  ac: 12,
  speed: 30,
  hitDice: '1d10',
};

const validCustomStats: CustomSimpleStats = {
  hp: 25,
  attack: 8,
  defense: 12,
  speed: 20,
  special: [],
};

describe('CharacterService', () => {
  let service: CharacterService;
  let repo: CharacterRepository;

  beforeEach(() => {
    repo = createMockRepository();
    service = new CharacterService(repo);
  });

  describe('createCharacter', () => {
    it('creates a D&D 5e character with default stats', async () => {
      const character = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
      });

      expect(character.name).toBe('Aragorn');
      expect(character.class).toBe('Ranger');
      expect(character.rpgSystem).toBe('dnd5e');
      expect(character.level).toBe(1);
      expect(character.userId).toBe('user1');
      expect(character.hp).toBe(character.maxHp);
      expect(character.inventory).toEqual([]);
    });

    it('creates a D&D 5e character with custom stats', async () => {
      const character = await service.createCharacter('user1', {
        name: 'Gandalf',
        class: 'Wizard',
        rpgSystem: 'dnd5e',
        stats: validDnd5eStats,
      });

      expect(character.name).toBe('Gandalf');
      const stats = character.stats as DnD5eStats;
      expect(stats.str).toBe(16);
      expect(stats.con).toBe(12);
    });

    it('calculates HP from D&D 5e stats', async () => {
      const character = await service.createCharacter('user1', {
        name: 'Fighter',
        class: 'Fighter',
        rpgSystem: 'dnd5e',
        stats: validDnd5eStats,
      });

      const conMod = Math.trunc((12 - 10) / 2);
      const expectedHp = 10 + conMod;
      expect(character.maxHp).toBe(expectedHp);
      expect(character.hp).toBe(expectedHp);
    });

    it('creates a custom system character with default stats', async () => {
      const character = await service.createCharacter('user1', {
        name: 'Hero',
        class: 'Warrior',
        rpgSystem: 'custom',
      });

      expect(character.rpgSystem).toBe('custom');
      expect(character.hp).toBe(25);
      expect(character.maxHp).toBe(25);
    });

    it('creates a custom system character with provided stats', async () => {
      const character = await service.createCharacter('user1', {
        name: 'Hero',
        class: 'Warrior',
        rpgSystem: 'custom',
        stats: validCustomStats,
      });

      const stats = character.stats as CustomSimpleStats;
      expect(stats.hp).toBe(25);
      expect(stats.attack).toBe(8);
    });

    it('throws ValidationError for invalid D&D 5e stats', async () => {
      const invalidStats = { ...validDnd5eStats, str: 50 };
      await expect(
        service.createCharacter('user1', {
          name: 'Bad',
          class: 'Fighter',
          rpgSystem: 'dnd5e',
          stats: invalidStats as DnD5eStats,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for invalid custom stats (hp <= 0)', async () => {
      const invalidStats = { ...validCustomStats, hp: 0 };
      await expect(
        service.createCharacter('user1', {
          name: 'Bad',
          class: 'Warrior',
          rpgSystem: 'custom',
          stats: invalidStats as CustomSimpleStats,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('sets backstory when provided', async () => {
      const character = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
        backstory: 'Heir of Isildur',
      });

      expect(character.backstory).toBe('Heir of Isildur');
    });
  });

  describe('getCharacter', () => {
    it('returns character by id', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
      });

      const found = await service.getCharacter(created.id);
      expect(found.id).toBe(created.id);
      expect(found.name).toBe('Aragorn');
    });

    it('throws NotFoundError for non-existent character', async () => {
      await expect(service.getCharacter('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listCharacters', () => {
    it('returns all characters for a user', async () => {
      await service.createCharacter('user1', { name: 'A', class: 'Fighter', rpgSystem: 'dnd5e' });
      await service.createCharacter('user1', { name: 'B', class: 'Wizard', rpgSystem: 'dnd5e' });
      await service.createCharacter('user2', { name: 'C', class: 'Rogue', rpgSystem: 'dnd5e' });

      const user1Chars = await service.listCharacters('user1');
      expect(user1Chars.length).toBe(2);

      const user2Chars = await service.listCharacters('user2');
      expect(user2Chars.length).toBe(1);
    });

    it('returns empty array for user with no characters', async () => {
      const chars = await service.listCharacters('nobody');
      expect(chars).toEqual([]);
    });
  });

  describe('updateStats', () => {
    it('updates D&D 5e stats', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
      });

      const newStats: DnD5eStats = { ...validDnd5eStats, str: 18 };
      const updated = await service.updateStats(created.id, newStats);
      const stats = updated.stats as DnD5eStats;
      expect(stats.str).toBe(18);
    });

    it('updates custom stats', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Hero',
        class: 'Warrior',
        rpgSystem: 'custom',
      });

      const newStats: CustomSimpleStats = {
        hp: 35,
        attack: 10,
        defense: 15,
        speed: 25,
        special: [],
      };
      const updated = await service.updateStats(created.id, newStats);
      const stats = updated.stats as CustomSimpleStats;
      expect(stats.hp).toBe(35);
    });

    it('throws ValidationError for invalid stats', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
      });

      const invalidStats = { ...validDnd5eStats, str: 50 };
      await expect(service.updateStats(created.id, invalidStats as DnD5eStats)).rejects.toThrow(
        ValidationError,
      );
    });

    it('throws NotFoundError for non-existent character', async () => {
      await expect(service.updateStats('nonexistent', validDnd5eStats)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('preserves experience when updating stats', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
      });

      await service.addExperience(created.id, 500);
      const newStats: DnD5eStats = { ...validDnd5eStats, str: 18 };
      const updated = await service.updateStats(created.id, newStats);
      const stats = updated.stats as Record<string, unknown>;
      expect(stats.experience).toBe(500);
    });
  });

  describe('updateInventory', () => {
    it('updates inventory with valid items', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
      });

      const items = [
        { name: 'Longsword', quantity: 1, description: 'A fine blade' },
        { name: 'Health Potion', quantity: 3 },
      ];

      const updated = await service.updateInventory(created.id, items);
      expect(updated.inventory.length).toBe(2);
      expect(updated.inventory[0]!.name).toBe('Longsword');
      expect(updated.inventory[1]!.quantity).toBe(3);
    });

    it('throws ValidationError for invalid inventory items', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
      });

      await expect(
        service.updateInventory(created.id, [{ name: '', quantity: 1 }]),
      ).rejects.toThrow(ValidationError);

      await expect(
        service.updateInventory(created.id, [{ name: 'Sword', quantity: -1 }]),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('modifyHp', () => {
    it('heals character by positive delta', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
        stats: validDnd5eStats,
      });

      const damaged = await service.modifyHp(created.id, -5);
      expect(damaged.hp).toBe(created.hp - 5);

      const healed = await service.modifyHp(created.id, 3);
      expect(healed.hp).toBe(created.hp - 5 + 3);
    });

    it('clamps HP to 0 when damage exceeds current HP', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
        stats: validDnd5eStats,
      });

      const damaged = await service.modifyHp(created.id, -1000);
      expect(damaged.hp).toBe(0);
    });

    it('clamps HP to maxHp when healing exceeds maxHp', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
        stats: validDnd5eStats,
      });

      const healed = await service.modifyHp(created.id, 1000);
      expect(healed.hp).toBe(healed.maxHp);
    });

    it('handles zero delta', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
        stats: validDnd5eStats,
      });

      const unchanged = await service.modifyHp(created.id, 0);
      expect(unchanged.hp).toBe(created.hp);
    });

    it('throws NotFoundError for non-existent character', async () => {
      await expect(service.modifyHp('nonexistent', 5)).rejects.toThrow(NotFoundError);
    });
  });

  describe('levelUp', () => {
    it('levels up D&D 5e character', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
        stats: validDnd5eStats,
      });

      const leveled = await service.levelUp(created.id);
      expect(leveled.level).toBe(2);
      expect(leveled.maxHp).toBeGreaterThan(created.maxHp);
      expect(leveled.hp).toBeGreaterThan(created.hp);
    });

    it('levels up custom character with attack choice', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Hero',
        class: 'Warrior',
        rpgSystem: 'custom',
        stats: validCustomStats,
      });

      const leveled = await service.levelUp(created.id, { customStatIncrease: 'attack' });
      expect(leveled.level).toBe(2);
      expect(leveled.maxHp).toBe(created.maxHp + 10);
      expect(leveled.hp).toBe(created.hp + 10);
      const stats = leveled.stats as CustomSimpleStats;
      expect(stats.attack).toBe(validCustomStats.attack + 2);
      expect(stats.defense).toBe(validCustomStats.defense);
    });

    it('levels up custom character with defense choice', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Hero',
        class: 'Warrior',
        rpgSystem: 'custom',
        stats: validCustomStats,
      });

      const leveled = await service.levelUp(created.id, { customStatIncrease: 'defense' });
      const stats = leveled.stats as CustomSimpleStats;
      expect(stats.defense).toBe(validCustomStats.defense + 2);
      expect(stats.attack).toBe(validCustomStats.attack);
    });

    it('defaults to attack choice for custom system', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Hero',
        class: 'Warrior',
        rpgSystem: 'custom',
        stats: validCustomStats,
      });

      const leveled = await service.levelUp(created.id);
      const stats = leveled.stats as CustomSimpleStats;
      expect(stats.attack).toBe(validCustomStats.attack + 2);
    });

    it('preserves experience on level up', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
        stats: validDnd5eStats,
      });

      await service.addExperience(created.id, 500);
      const leveled = await service.levelUp(created.id);
      const stats = leveled.stats as Record<string, unknown>;
      expect(stats.experience).toBe(500);
    });
  });

  describe('addExperience', () => {
    it('adds experience to D&D 5e character', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
        stats: validDnd5eStats,
      });

      const updated = await service.addExperience(created.id, 300);
      const stats = updated.stats as Record<string, unknown>;
      expect(stats.experience).toBe(300);
    });

    it('auto-levels D&D 5e character when XP threshold met', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
        stats: validDnd5eStats,
      });

      const updated = await service.addExperience(created.id, 300);
      expect(updated.level).toBe(2);
    });

    it('auto-levels custom character when XP threshold met', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Hero',
        class: 'Warrior',
        rpgSystem: 'custom',
        stats: validCustomStats,
      });

      const updated = await service.addExperience(created.id, 100);
      expect(updated.level).toBe(2);
    });

    it('handles multiple level ups from large XP gain', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
        stats: validDnd5eStats,
      });

      const updated = await service.addExperience(created.id, 900);
      expect(updated.level).toBe(3);
    });

    it('does not level up past max level for D&D 5e', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
        stats: validDnd5eStats,
      });

      const updated = await service.addExperience(created.id, 999999);
      expect(updated.level).toBeLessThanOrEqual(20);
    });

    it('accumulates XP without leveling if below threshold', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
        stats: validDnd5eStats,
      });

      const updated = await service.addExperience(created.id, 100);
      expect(updated.level).toBe(1);
      const stats = updated.stats as Record<string, unknown>;
      expect(stats.experience).toBe(100);
    });
  });

  describe('deleteCharacter', () => {
    it('deletes an existing character', async () => {
      const created = await service.createCharacter('user1', {
        name: 'Aragorn',
        class: 'Ranger',
        rpgSystem: 'dnd5e',
      });

      await service.deleteCharacter(created.id);
      await expect(service.getCharacter(created.id)).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError for non-existent character', async () => {
      await expect(service.deleteCharacter('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });
});
