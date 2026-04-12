import { describe, it, expect } from 'bun:test';
import {
  validateStats,
  applyLevelUp,
  getXpThresholdForLevel,
  DEFAULT_CUSTOM_STATS,
  type LevelUpChoice,
} from '../../../../src/services/character/stats/custom.js';

describe('validateStats', () => {
  const validStats = {
    hp: 25,
    attack: 8,
    defense: 12,
    speed: 20,
    special: [],
  };

  it('accepts valid custom stats', () => {
    const result = validateStats(validStats);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hp).toBe(25);
    }
  });

  it('accepts stats with special abilities', () => {
    const statsWithSpecial = {
      ...validStats,
      special: [{ name: 'Fireball', description: 'Deals 6d6 fire damage' }],
    };
    const result = validateStats(statsWithSpecial);
    expect(result.success).toBe(true);
  });

  it('rejects hp of 0 (business rule: hp must be > 0)', () => {
    const result = validateStats({ ...validStats, hp: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('hp: must be greater than 0');
    }
  });

  it('rejects negative hp (schema rule)', () => {
    const result = validateStats({ ...validStats, hp: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects speed of 0 (business rule: speed must be > 0)', () => {
    const result = validateStats({ ...validStats, speed: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('speed: must be greater than 0');
    }
  });

  it('rejects negative attack', () => {
    const result = validateStats({ ...validStats, attack: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects negative defense', () => {
    const result = validateStats({ ...validStats, defense: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const result = validateStats({ hp: 25 });
    expect(result.success).toBe(false);
  });

  it('rejects non-object input', () => {
    const result = validateStats('not an object');
    expect(result.success).toBe(false);
  });

  it('accepts stats with hp > 0 and speed > 0', () => {
    const result = validateStats({ hp: 1, attack: 0, defense: 0, speed: 1, special: [] });
    expect(result.success).toBe(true);
  });
});

describe('applyLevelUp', () => {
  const baseStats = {
    hp: 25,
    attack: 8,
    defense: 12,
    speed: 20,
    special: [],
  };

  it('increases hp by 10 with attack choice', () => {
    const result = applyLevelUp(baseStats, 'attack');
    expect(result.hp).toBe(35);
  });

  it('increases attack by 2 with attack choice', () => {
    const result = applyLevelUp(baseStats, 'attack');
    expect(result.attack).toBe(10);
  });

  it('does not increase defense with attack choice', () => {
    const result = applyLevelUp(baseStats, 'attack');
    expect(result.defense).toBe(12);
  });

  it('increases defense by 2 with defense choice', () => {
    const result = applyLevelUp(baseStats, 'defense');
    expect(result.defense).toBe(14);
  });

  it('does not increase attack with defense choice', () => {
    const result = applyLevelUp(baseStats, 'defense');
    expect(result.attack).toBe(8);
  });

  it('defaults to attack choice when no choice specified', () => {
    const result = applyLevelUp(baseStats);
    expect(result.attack).toBe(10);
    expect(result.defense).toBe(12);
  });

  it('preserves speed and special', () => {
    const result = applyLevelUp(baseStats, 'attack');
    expect(result.speed).toBe(20);
    expect(result.special).toEqual([]);
  });

  it('preserves special abilities', () => {
    const statsWithSpecial = {
      ...baseStats,
      special: [{ name: 'Fireball', description: 'Deals 6d6 fire damage' }],
    };
    const result = applyLevelUp(statsWithSpecial, 'attack');
    expect(result.special).toEqual([{ name: 'Fireball', description: 'Deals 6d6 fire damage' }]);
  });
});

describe('getXpThresholdForLevel', () => {
  it('returns 0 for level 1', () => {
    expect(getXpThresholdForLevel(1)).toBe(0);
  });

  it('returns 100 for level 2', () => {
    expect(getXpThresholdForLevel(2)).toBe(100);
  });

  it('returns 300 for level 3 (50 * 3 * 2)', () => {
    expect(getXpThresholdForLevel(3)).toBe(300);
  });

  it('returns 600 for level 4 (50 * 4 * 3)', () => {
    expect(getXpThresholdForLevel(4)).toBe(600);
  });

  it('returns 0 for level 0', () => {
    expect(getXpThresholdForLevel(0)).toBe(0);
  });

  it('returns correct value for level 10', () => {
    expect(getXpThresholdForLevel(10)).toBe(50 * 10 * 9);
  });
});

describe('DEFAULT_CUSTOM_STATS', () => {
  it('has hp 25', () => {
    expect(DEFAULT_CUSTOM_STATS.hp).toBe(25);
  });

  it('has attack 5', () => {
    expect(DEFAULT_CUSTOM_STATS.attack).toBe(5);
  });

  it('has defense 5', () => {
    expect(DEFAULT_CUSTOM_STATS.defense).toBe(5);
  });

  it('has speed 20', () => {
    expect(DEFAULT_CUSTOM_STATS.speed).toBe(20);
  });

  it('has empty special array', () => {
    expect(DEFAULT_CUSTOM_STATS.special).toEqual([]);
  });
});
