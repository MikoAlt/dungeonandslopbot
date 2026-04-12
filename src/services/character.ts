import { z } from 'zod';
import type { Character, DnD5eStats, CustomSimpleStats } from '../types/character.js';
import { NotFoundError, ValidationError } from '../errors.js';
import * as dnd5e from './character/stats/dnd5e.js';
import * as custom from './character/stats/custom.js';

export interface CharacterRepository {
  create(data: CharacterCreateInput): Promise<Character>;
  findById(id: string): Promise<Character | null>;
  findByUserId(userId: string): Promise<Character[]>;
  update(id: string, data: CharacterUpdateData): Promise<Character>;
  delete(id: string): Promise<void>;
}

export interface CharacterCreateInput {
  userId: string;
  name: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  rpgSystem: 'dnd5e' | 'custom';
  stats: DnD5eStats | CustomSimpleStats;
  inventory: Array<{ name: string; quantity: number; description?: string }>;
  backstory?: string;
  campaignId?: string;
}

export interface CharacterUpdateData {
  name?: string;
  class?: string;
  level?: number;
  hp?: number;
  maxHp?: number;
  stats?: DnD5eStats | CustomSimpleStats;
  inventory?: Array<{ name: string; quantity: number; description?: string }>;
  backstory?: string;
  campaignId?: string;
}

export interface CreateCharacterData {
  name: string;
  class: string;
  rpgSystem: 'dnd5e' | 'custom';
  backstory?: string;
  stats?: DnD5eStats | CustomSimpleStats;
}

export interface LevelUpChoices {
  customStatIncrease?: 'attack' | 'defense';
}

const InventoryItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(0),
  description: z.string().optional(),
});

type StatsWithXp = (DnD5eStats | CustomSimpleStats) & { experience?: number };

function getXpFromStats(stats: DnD5eStats | CustomSimpleStats): number {
  const record = stats as Record<string, unknown>;
  return typeof record.experience === 'number' ? record.experience : 0;
}

function withXp(stats: DnD5eStats | CustomSimpleStats, xp: number): StatsWithXp {
  return { ...stats, experience: xp };
}

function stripXp(stats: StatsWithXp): DnD5eStats | CustomSimpleStats {
  const { experience: _, ...rest } = stats;
  return rest;
}

export class CharacterService {
  constructor(private readonly repo: CharacterRepository) {}

  async createCharacter(userId: string, data: CreateCharacterData): Promise<Character> {
    let stats: DnD5eStats | CustomSimpleStats;
    let maxHp: number;

    if (data.rpgSystem === 'dnd5e') {
      stats = data.stats ?? { ...dnd5e.DEFAULT_DND5E_STATS };
      const validation = dnd5e.validateStats(stats);
      if (!validation.success) {
        throw new ValidationError(validation.errors.map((e) => ({ message: e })));
      }
      stats = validation.data;
      const { size } = dnd5e.parseHitDice((stats as DnD5eStats).hitDice);
      const conMod = dnd5e.calculateModifier((stats as DnD5eStats).con);
      maxHp = dnd5e.calculateHitPoints(1, conMod, size);
    } else {
      stats = data.stats ?? { ...custom.DEFAULT_CUSTOM_STATS };
      const validation = custom.validateStats(stats);
      if (!validation.success) {
        throw new ValidationError(validation.errors.map((e) => ({ message: e })));
      }
      stats = validation.data;
      maxHp = (stats as CustomSimpleStats).hp;
    }

    return this.repo.create({
      userId,
      name: data.name,
      class: data.class,
      level: 1,
      hp: maxHp,
      maxHp,
      rpgSystem: data.rpgSystem,
      stats,
      inventory: [],
      backstory: data.backstory,
    });
  }

  async getCharacter(id: string): Promise<Character> {
    const character = await this.repo.findById(id);
    if (!character) {
      throw new NotFoundError('Character', id);
    }
    return character;
  }

  async listCharacters(userId: string): Promise<Character[]> {
    return this.repo.findByUserId(userId);
  }

  async updateStats(id: string, stats: DnD5eStats | CustomSimpleStats): Promise<Character> {
    const character = await this.getCharacter(id);

    let validatedStats: DnD5eStats | CustomSimpleStats;
    if (character.rpgSystem === 'dnd5e') {
      const validation = dnd5e.validateStats(stats);
      if (!validation.success) {
        throw new ValidationError(validation.errors.map((e) => ({ message: e })));
      }
      validatedStats = validation.data;
    } else {
      const validation = custom.validateStats(stats);
      if (!validation.success) {
        throw new ValidationError(validation.errors.map((e) => ({ message: e })));
      }
      validatedStats = validation.data;
    }

    const xp = getXpFromStats(character.stats);
    const statsWithXp = withXp(validatedStats, xp);

    return this.repo.update(id, { stats: statsWithXp });
  }

  async updateInventory(id: string, items: unknown[]): Promise<Character> {
    const validatedItems = items.map((item, i) => {
      const result = InventoryItemSchema.safeParse(item);
      if (!result.success) {
        throw new ValidationError(
          result.error.issues.map((issue) => ({
            message: issue.message,
            path: `inventory[${i}].${issue.path.join('.')}`,
          })),
        );
      }
      return result.data;
    });

    return this.repo.update(id, { inventory: validatedItems });
  }

  async updateBackstory(id: string, backstory: string): Promise<Character> {
    return this.repo.update(id, { backstory });
  }

  async modifyHp(id: string, delta: number): Promise<Character> {
    const character = await this.getCharacter(id);
    const newHp = Math.max(0, Math.min(character.maxHp, character.hp + delta));
    return this.repo.update(id, { hp: newHp });
  }

  async levelUp(id: string, choices?: LevelUpChoices): Promise<Character> {
    const character = await this.getCharacter(id);
    const newLevel = character.level + 1;
    const xp = getXpFromStats(character.stats);

    let updatedStats: DnD5eStats | CustomSimpleStats;
    let maxHpIncrease: number;

    if (character.rpgSystem === 'dnd5e') {
      const stats = character.stats as DnD5eStats;
      const { size } = dnd5e.parseHitDice(stats.hitDice);
      const conMod = dnd5e.calculateModifier(stats.con);
      maxHpIncrease = Math.max(1, Math.floor(size / 2) + 1 + conMod);
      updatedStats = { ...stats };
    } else {
      const stats = character.stats as CustomSimpleStats;
      const choice = choices?.customStatIncrease ?? 'attack';
      updatedStats = custom.applyLevelUp(stats, choice);
      maxHpIncrease = 10;
    }

    updatedStats = withXp(updatedStats, xp) as DnD5eStats | CustomSimpleStats;

    const newMaxHp = character.maxHp + maxHpIncrease;
    const newHp = character.hp + maxHpIncrease;

    return this.repo.update(id, {
      level: newLevel,
      stats: updatedStats,
      maxHp: newMaxHp,
      hp: newHp,
    });
  }

  async addExperience(id: string, amount: number): Promise<Character> {
    let character = await this.getCharacter(id);
    const currentXp = getXpFromStats(character.stats);
    const newXp = currentXp + amount;

    character = await this.repo.update(id, {
      stats: withXp(character.stats, newXp),
    });

    const maxLevel = character.rpgSystem === 'dnd5e' ? 20 : 100;
    while (character.level < maxLevel) {
      const threshold =
        character.rpgSystem === 'dnd5e'
          ? dnd5e.getXpThresholdForLevel(character.level + 1)
          : custom.getXpThresholdForLevel(character.level + 1);

      if (newXp >= threshold) {
        character = await this.levelUp(character.id);
      } else {
        break;
      }
    }

    return character;
  }

  async deleteCharacter(id: string): Promise<void> {
    await this.getCharacter(id);
    await this.repo.delete(id);
  }
}
