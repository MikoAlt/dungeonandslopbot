import { describe, it, expect } from 'bun:test';
import {
  calculateModifier,
  calculateAc,
  calculateHitPoints,
  validateStats,
  proficiencyBonus,
  parseHitDice,
  getXpThresholdForLevel,
  getLevelForXp,
  DEFAULT_DND5E_STATS,
  DND5E_XP_THRESHOLDS,
  type ArmorData,
} from '../../../../src/services/character/stats/dnd5e.js';

describe('calculateModifier', () => {
  it('returns +0 for score 10', () => {
    expect(calculateModifier(10)).toBe(0);
  });

  it('returns +1 for score 12', () => {
    expect(calculateModifier(12)).toBe(1);
  });

  it('returns +5 for score 20', () => {
    expect(calculateModifier(20)).toBe(5);
  });

  it('returns -1 for score 9 (rounds toward zero)', () => {
    expect(calculateModifier(9)).toBe(-1);
  });

  it('returns -5 for score 1', () => {
    expect(calculateModifier(1)).toBe(-5);
  });

  it('returns +10 for score 30', () => {
    expect(calculateModifier(30)).toBe(10);
  });

  it('rounds down for odd scores below 10', () => {
    expect(calculateModifier(7)).toBe(-2);
    expect(calculateModifier(9)).toBe(-1);
    expect(calculateModifier(11)).toBe(0);
    expect(calculateModifier(13)).toBe(1);
  });
});

describe('calculateAc', () => {
  it('returns 10 + dex modifier with no armor', () => {
    expect(calculateAc(null, 3)).toBe(13);
  });

  it('returns 10 + negative dex modifier with no armor', () => {
    expect(calculateAc(null, -2)).toBe(8);
  });

  it('returns base AC + full dex with armor allowing unlimited dex', () => {
    const leather: ArmorData = { baseAc: 11, maxDexBonus: null };
    expect(calculateAc(leather, 4)).toBe(15);
  });

  it('caps dex bonus to maxDexBonus', () => {
    const halfPlate: ArmorData = { baseAc: 15, maxDexBonus: 2 };
    expect(calculateAc(halfPlate, 4)).toBe(17);
  });

  it('allows negative dex modifier with armor', () => {
    const plate: ArmorData = { baseAc: 18, maxDexBonus: 0 };
    expect(calculateAc(plate, -2)).toBe(16);
  });

  it('applies full negative dex with no armor', () => {
    expect(calculateAc(null, -5)).toBe(5);
  });
});

describe('calculateHitPoints', () => {
  it('calculates level 1 HP for d10 with +2 con', () => {
    expect(calculateHitPoints(1, 2, 10)).toBe(12);
  });

  it('calculates level 3 HP for d8 with +1 con', () => {
    const level1 = 8 + 1;
    const avg = Math.floor(8 / 2) + 1;
    const subsequent = Math.max(1, avg + 1);
    expect(calculateHitPoints(3, 1, 8)).toBe(level1 + 2 * subsequent);
  });

  it('ensures minimum 1 HP per level with negative con', () => {
    expect(calculateHitPoints(1, -5, 6)).toBe(1);
    expect(calculateHitPoints(2, -5, 6)).toBe(2);
  });

  it('calculates level 20 HP for d10 with +3 con', () => {
    const first = 10 + 3;
    const subsequent = Math.max(1, 6 + 3);
    expect(calculateHitPoints(20, 3, 10)).toBe(first + 19 * subsequent);
  });

  it('calculates level 1 HP for d6 with +0 con', () => {
    expect(calculateHitPoints(1, 0, 6)).toBe(6);
  });

  it('calculates level 5 HP for d12 with +4 con', () => {
    const first = 12 + 4;
    const subsequent = Math.max(1, 7 + 4);
    expect(calculateHitPoints(5, 4, 12)).toBe(first + 4 * subsequent);
  });
});

describe('validateStats', () => {
  const validStats = {
    str: 16,
    dex: 14,
    con: 15,
    int: 12,
    wis: 10,
    cha: 8,
    ac: 18,
    speed: 30,
    hitDice: '2d8',
  };

  it('accepts valid D&D 5e stats', () => {
    const result = validateStats(validStats);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.str).toBe(16);
    }
  });

  it('rejects stats with ability score out of range', () => {
    const result = validateStats({ ...validStats, str: 50 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('rejects stats with negative AC', () => {
    const result = validateStats({ ...validStats, ac: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects stats with missing fields', () => {
    const result = validateStats({ str: 10, dex: 10 });
    expect(result.success).toBe(false);
  });

  it('rejects non-object input', () => {
    const result = validateStats('not an object');
    expect(result.success).toBe(false);
  });
});

describe('proficiencyBonus', () => {
  it('returns +2 for level 1', () => {
    expect(proficiencyBonus(1)).toBe(2);
  });

  it('returns +2 for levels 1-4', () => {
    expect(proficiencyBonus(1)).toBe(2);
    expect(proficiencyBonus(2)).toBe(2);
    expect(proficiencyBonus(3)).toBe(2);
    expect(proficiencyBonus(4)).toBe(2);
  });

  it('returns +3 for levels 5-8', () => {
    expect(proficiencyBonus(5)).toBe(3);
    expect(proficiencyBonus(8)).toBe(3);
  });

  it('returns +4 for levels 9-12', () => {
    expect(proficiencyBonus(9)).toBe(4);
    expect(proficiencyBonus(12)).toBe(4);
  });

  it('returns +6 for levels 17-20', () => {
    expect(proficiencyBonus(17)).toBe(6);
    expect(proficiencyBonus(20)).toBe(6);
  });
});

describe('parseHitDice', () => {
  it('parses "1d10" correctly', () => {
    const result = parseHitDice('1d10');
    expect(result.count).toBe(1);
    expect(result.size).toBe(10);
  });

  it('parses "2d8" correctly', () => {
    const result = parseHitDice('2d8');
    expect(result.count).toBe(2);
    expect(result.size).toBe(8);
  });

  it('parses "3d6" correctly', () => {
    const result = parseHitDice('3d6');
    expect(result.count).toBe(3);
    expect(result.size).toBe(6);
  });

  it('throws for invalid format', () => {
    expect(() => parseHitDice('invalid')).toThrow();
    expect(() => parseHitDice('d10')).toThrow();
    expect(() => parseHitDice('10')).toThrow();
    expect(() => parseHitDice('1d')).toThrow();
  });
});

describe('getXpThresholdForLevel', () => {
  it('returns 0 for level 1', () => {
    expect(getXpThresholdForLevel(1)).toBe(0);
  });

  it('returns 300 for level 2', () => {
    expect(getXpThresholdForLevel(2)).toBe(300);
  });

  it('returns 6500 for level 5', () => {
    expect(getXpThresholdForLevel(5)).toBe(6500);
  });

  it('returns 355000 for level 20', () => {
    expect(getXpThresholdForLevel(20)).toBe(355000);
  });

  it('clamps to level 1 for level 0', () => {
    expect(getXpThresholdForLevel(0)).toBe(0);
  });

  it('clamps to level 20 for level 25', () => {
    expect(getXpThresholdForLevel(25)).toBe(355000);
  });
});

describe('getLevelForXp', () => {
  it('returns level 1 for 0 XP', () => {
    expect(getLevelForXp(0)).toBe(1);
  });

  it('returns level 2 for 300 XP', () => {
    expect(getLevelForXp(300)).toBe(2);
  });

  it('returns level 1 for 299 XP', () => {
    expect(getLevelForXp(299)).toBe(1);
  });

  it('returns level 5 for 6500 XP', () => {
    expect(getLevelForXp(6500)).toBe(5);
  });

  it('returns level 20 for 355000 XP', () => {
    expect(getLevelForXp(355000)).toBe(20);
  });

  it('returns level 20 for XP above max', () => {
    expect(getLevelForXp(500000)).toBe(20);
  });
});

describe('DEFAULT_DND5E_STATS', () => {
  it('has all ability scores at 10', () => {
    expect(DEFAULT_DND5E_STATS.str).toBe(10);
    expect(DEFAULT_DND5E_STATS.dex).toBe(10);
    expect(DEFAULT_DND5E_STATS.con).toBe(10);
    expect(DEFAULT_DND5E_STATS.int).toBe(10);
    expect(DEFAULT_DND5E_STATS.wis).toBe(10);
    expect(DEFAULT_DND5E_STATS.cha).toBe(10);
  });

  it('has AC 10 and speed 30', () => {
    expect(DEFAULT_DND5E_STATS.ac).toBe(10);
    expect(DEFAULT_DND5E_STATS.speed).toBe(30);
  });

  it('has hitDice "1d10"', () => {
    expect(DEFAULT_DND5E_STATS.hitDice).toBe('1d10');
  });
});

describe('DND5E_XP_THRESHOLDS', () => {
  it('has 20 entries for levels 1-20', () => {
    expect(DND5E_XP_THRESHOLDS.length).toBe(20);
  });

  it('starts at 0 for level 1', () => {
    expect(DND5E_XP_THRESHOLDS[0]).toBe(0);
  });

  it('is monotonically increasing', () => {
    for (let i = 1; i < DND5E_XP_THRESHOLDS.length; i++) {
      expect(DND5E_XP_THRESHOLDS[i]!).toBeGreaterThan(DND5E_XP_THRESHOLDS[i - 1]!);
    }
  });
});
