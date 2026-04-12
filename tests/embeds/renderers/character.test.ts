import { describe, test, expect } from 'bun:test';
import {
  createHpBar,
  renderCharacterSheet,
  renderCharacterMini,
} from '../../../src/embeds/renderers/character.js';
import { Colors } from '../../../src/embeds/themes.js';
import type { Character, DnD5eStats, CustomSimpleStats } from '../../../src/types/character.js';

function makeDnd5eCharacter(overrides: Partial<Character> = {}): Character {
  const stats: DnD5eStats = {
    str: 16,
    dex: 14,
    con: 12,
    int: 10,
    wis: 8,
    cha: 13,
    ac: 15,
    speed: 30,
    hitDice: '1d10',
  };
  return {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test Hero',
    class: 'Fighter',
    level: 5,
    hp: 45,
    maxHp: 50,
    rpgSystem: 'dnd5e',
    stats,
    inventory: [],
    backstory: undefined,
    campaignId: '00000000-0000-0000-0000-000000000099',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeCustomCharacter(overrides: Partial<Character> = {}): Character {
  const stats: CustomSimpleStats = {
    hp: 30,
    attack: 12,
    defense: 8,
    speed: 5,
    special: [{ name: 'Fireball', description: 'Deal 3d6 fire damage' }],
  };
  return {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Custom Hero',
    class: 'Mage',
    level: 3,
    hp: 30,
    maxHp: 40,
    rpgSystem: 'custom',
    stats,
    inventory: [],
    backstory: undefined,
    campaignId: '00000000-0000-0000-0000-000000000099',
    userId: 'user-456',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('createHpBar', () => {
  test('full HP shows full bar', () => {
    expect(createHpBar(100, 100)).toBe('██████████ 100/100');
  });

  test('half HP shows half bar', () => {
    expect(createHpBar(50, 100)).toBe('█████░░░░░ 50/100');
  });

  test('zero HP shows empty bar', () => {
    expect(createHpBar(0, 100)).toBe('░░░░░░░░░░ 0/100');
  });

  test('clamps HP above max', () => {
    expect(createHpBar(120, 100)).toBe('██████████ 100/100');
  });

  test('clamps negative HP to zero', () => {
    expect(createHpBar(-5, 100)).toBe('░░░░░░░░░░ 0/100');
  });

  test('custom bar length', () => {
    expect(createHpBar(5, 10, 5)).toBe('███░░ 5/10');
  });
});

describe('renderCharacterSheet', () => {
  test('renders D&D 5e character with ability scores', () => {
    const character = makeDnd5eCharacter();
    const embeds = renderCharacterSheet(character);

    expect(embeds.length).toBeGreaterThanOrEqual(1);
    const first = embeds[0].data;
    expect(first.title).toContain('Test Hero');
    expect(first.title).toContain('Level 5');
    expect(first.title).toContain('Fighter');
    expect(first.color).toBe(Colors.RPG);

    const fields = first.fields ?? [];
    const hpField = fields.find((f) => f.name === 'HP');
    expect(hpField).toBeDefined();
    expect(hpField!.value).toContain('45/50');

    const abilitiesField = fields.find((f) => f.name === 'Abilities');
    expect(abilitiesField).toBeDefined();
    expect(abilitiesField!.value).toContain('STR 16 (+3)');
    expect(abilitiesField!.value).toContain('DEX 14 (+2)');
    expect(abilitiesField!.value).toContain('CON 12 (+1)');
    expect(abilitiesField!.value).toContain('INT 10 (+0)');
    expect(abilitiesField!.value).toContain('WIS 8 (-1)');
    expect(abilitiesField!.value).toContain('CHA 13 (+1)');

    const acField = fields.find((f) => f.name === 'AC');
    expect(acField).toBeDefined();
    expect(acField!.value).toBe('15');

    const speedField = fields.find((f) => f.name === 'Speed');
    expect(speedField).toBeDefined();
    expect(speedField!.value).toBe('30 ft.');
  });

  test('renders Custom Simple character with special abilities', () => {
    const character = makeCustomCharacter();
    const embeds = renderCharacterSheet(character);

    expect(embeds.length).toBeGreaterThanOrEqual(1);
    const fields = embeds[0].data.fields ?? [];

    const specialField = fields.find((f) => f.name === 'Special Abilities');
    expect(specialField).toBeDefined();
    expect(specialField!.value).toContain('Fireball');
    expect(specialField!.value).toContain('3d6 fire damage');
  });

  test('renders inventory with quantities', () => {
    const character = makeDnd5eCharacter({
      inventory: [
        { name: 'Longsword', quantity: 1 },
        { name: 'Health Potion', quantity: 3, description: 'Restores 2d4+2 HP' },
      ],
    });
    const embeds = renderCharacterSheet(character);
    const fields = embeds[0].data.fields ?? [];

    const invField = fields.find((f) => f.name === 'Inventory');
    expect(invField).toBeDefined();
    expect(invField!.value).toContain('Longsword');
    expect(invField!.value).toContain('Health Potion x3');
    expect(invField!.value).toContain('Restores 2d4+2 HP');
  });

  test('renders backstory via description', () => {
    const character = makeDnd5eCharacter({ backstory: 'A brave warrior from the north.' });
    const embeds = renderCharacterSheet(character);
    expect(embeds[0].data.description).toContain('A brave warrior from the north.');
  });

  test('uses EmbedPaginator for long backstory', () => {
    const longBackstory = 'A'.repeat(5000);
    const character = makeDnd5eCharacter({ backstory: longBackstory });
    const embeds = renderCharacterSheet(character);
    expect(embeds.length).toBeGreaterThanOrEqual(1);
    const totalDesc = embeds.map((e) => e.data.description ?? '').join('');
    expect(totalDesc).toContain('A'.repeat(100));
  });

  test('footer contains character ID', () => {
    const character = makeDnd5eCharacter();
    const embeds = renderCharacterSheet(character);
    const lastEmbed = embeds[embeds.length - 1];
    expect(lastEmbed.data.footer?.text).toContain(character.id);
  });

  test('negative ability modifier formats correctly', () => {
    const character = makeDnd5eCharacter({
      stats: {
        str: 6,
        dex: 8,
        con: 10,
        int: 12,
        wis: 14,
        cha: 16,
        ac: 12,
        speed: 30,
        hitDice: '1d8',
      },
    });
    const embeds = renderCharacterSheet(character);
    const fields = embeds[0].data.fields ?? [];
    const abilitiesField = fields.find((f) => f.name === 'Abilities');
    expect(abilitiesField!.value).toContain('STR 6 (-2)');
    expect(abilitiesField!.value).toContain('DEX 8 (-1)');
  });
});

describe('renderCharacterMini', () => {
  test('renders compact character summary', () => {
    const character = makeDnd5eCharacter();
    const embed = renderCharacterMini(character);
    const data = embed.data;

    expect(data.title).toBe('Test Hero');
    expect(data.color).toBe(Colors.RPG);

    const fields = data.fields ?? [];
    const classField = fields.find((f) => f.name === 'Class');
    expect(classField!.value).toBe('Fighter');

    const levelField = fields.find((f) => f.name === 'Level');
    expect(levelField!.value).toBe('5');

    const hpField = fields.find((f) => f.name === 'HP');
    expect(hpField!.value).toContain('45/50');
  });
});
