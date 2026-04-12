import { describe, expect, it } from 'bun:test';
import {
  DnD5eEngine,
  abilityModifier,
  proficiencyBonus,
  calculateAc,
} from '../../../src/services/rpg/dnd5e';
import { getEngine } from '../../../src/services/rpg/engine';
import type { DnD5eStats } from '../../../src/types/character';

describe('DnD5eEngine', () => {
  const engine = new DnD5eEngine();

  describe('abilityModifier', () => {
    it('returns 0 for score 10', () => {
      expect(abilityModifier(10)).toBe(0);
    });

    it('returns 0 for score 11', () => {
      expect(abilityModifier(11)).toBe(0);
    });

    it('returns positive modifier for high scores', () => {
      expect(abilityModifier(18)).toBe(4);
      expect(abilityModifier(20)).toBe(5);
    });

    it('returns negative modifier for low scores', () => {
      expect(abilityModifier(8)).toBe(-1);
      expect(abilityModifier(6)).toBe(-2);
      expect(abilityModifier(1)).toBe(-5);
    });

    it('rounds toward zero', () => {
      expect(abilityModifier(13)).toBe(1);
      expect(abilityModifier(9)).toBe(-1);
    });
  });

  describe('proficiencyBonus', () => {
    it('returns 2 for levels 1-4', () => {
      expect(proficiencyBonus(1)).toBe(2);
      expect(proficiencyBonus(4)).toBe(2);
    });

    it('returns 3 for levels 5-8', () => {
      expect(proficiencyBonus(5)).toBe(3);
      expect(proficiencyBonus(8)).toBe(3);
    });

    it('returns 4 for levels 9-12', () => {
      expect(proficiencyBonus(9)).toBe(4);
      expect(proficiencyBonus(12)).toBe(4);
    });

    it('returns 5 for levels 13-16', () => {
      expect(proficiencyBonus(13)).toBe(5);
      expect(proficiencyBonus(16)).toBe(5);
    });

    it('returns 6 for levels 17-20', () => {
      expect(proficiencyBonus(17)).toBe(6);
      expect(proficiencyBonus(20)).toBe(6);
    });
  });

  describe('calculateAc', () => {
    it('returns 10 + dex modifier', () => {
      const stats: DnD5eStats = {
        str: 10,
        dex: 14,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
        ac: 12,
        speed: 30,
        hitDice: '1d8',
      };
      expect(calculateAc(stats)).toBe(12);
    });

    it('returns 10 for dex 10', () => {
      const stats: DnD5eStats = {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
        ac: 10,
        speed: 30,
        hitDice: '1d8',
      };
      expect(calculateAc(stats)).toBe(10);
    });

    it('handles negative dex modifier', () => {
      const stats: DnD5eStats = {
        str: 10,
        dex: 8,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
        ac: 9,
        speed: 30,
        hitDice: '1d8',
      };
      expect(calculateAc(stats)).toBe(9);
    });
  });

  describe('createDefaultStats', () => {
    it('returns stats with standard array mapped to abilities', () => {
      const stats = engine.createDefaultStats();
      expect(stats.str).toBe(15);
      expect(stats.dex).toBe(14);
      expect(stats.con).toBe(13);
      expect(stats.int).toBe(12);
      expect(stats.wis).toBe(10);
      expect(stats.cha).toBe(8);
    });

    it('sets AC based on dex modifier', () => {
      const stats = engine.createDefaultStats();
      expect(stats.ac).toBe(10 + abilityModifier(14));
    });

    it('sets default speed and hit dice', () => {
      const stats = engine.createDefaultStats();
      expect(stats.speed).toBe(30);
      expect(stats.hitDice).toBe('1d8');
    });
  });

  describe('validateStats', () => {
    it('validates correct stats', () => {
      const stats = engine.createDefaultStats();
      const result = engine.validateStats(stats);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects ability scores below 1', () => {
      const stats: DnD5eStats = {
        str: 0,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
        ac: 10,
        speed: 30,
        hitDice: '1d8',
      };
      const result = engine.validateStats(stats);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('str must be an integer between 1 and 30, got 0');
    });

    it('rejects ability scores above 30', () => {
      const stats: DnD5eStats = {
        str: 31,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
        ac: 10,
        speed: 30,
        hitDice: '1d8',
      };
      const result = engine.validateStats(stats);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('str must be an integer between 1 and 30, got 31');
    });

    it('rejects negative AC', () => {
      const stats: DnD5eStats = {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
        ac: -1,
        speed: 30,
        hitDice: '1d8',
      };
      const result = engine.validateStats(stats);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('ac'))).toBe(true);
    });

    it('rejects negative speed', () => {
      const stats: DnD5eStats = {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
        ac: 10,
        speed: -5,
        hitDice: '1d8',
      };
      const result = engine.validateStats(stats);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('speed'))).toBe(true);
    });

    it('collects multiple errors', () => {
      const stats: DnD5eStats = {
        str: 0,
        dex: 50,
        con: -1,
        int: 10,
        wis: 10,
        cha: 10,
        ac: -1,
        speed: -1,
        hitDice: '1d8',
      };
      const result = engine.validateStats(stats);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('applyLevelUp', () => {
    it('returns hp gained based on hit die + con mod', () => {
      const stats = engine.createDefaultStats();
      const result = engine.applyLevelUp(stats, 2);
      expect(result.hpGained).toBeGreaterThanOrEqual(1);
      expect(result.hpGained).toBeLessThanOrEqual(8 + abilityModifier(stats.con));
    });

    it('minimum 1 hp gained even with negative con', () => {
      const stats: DnD5eStats = {
        str: 10,
        dex: 10,
        con: 1,
        int: 10,
        wis: 10,
        cha: 10,
        ac: 10,
        speed: 30,
        hitDice: '1d8',
      };
      const result = engine.applyLevelUp(stats, 2);
      expect(result.hpGained).toBeGreaterThanOrEqual(1);
    });

    it('indicates ASI at levels 4, 8, 12, 16, 19', () => {
      const stats = engine.createDefaultStats();
      for (const level of [4, 8, 12, 16, 19]) {
        const result = engine.applyLevelUp(stats, level);
        expect(result.asiAvailable).toBe(true);
      }
    });

    it('does not indicate ASI at other levels', () => {
      const stats = engine.createDefaultStats();
      for (const level of [2, 3, 5, 7, 10, 15, 20]) {
        const result = engine.applyLevelUp(stats, level);
        expect(result.asiAvailable).toBe(false);
      }
    });

    it('recalculates AC from dex modifier', () => {
      const stats: DnD5eStats = {
        str: 10,
        dex: 14,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
        ac: 999,
        speed: 30,
        hitDice: '1d8',
      };
      const result = engine.applyLevelUp(stats, 2);
      expect(result.stats.ac).toBe(12);
    });
  });

  describe('calculateDamageRoll', () => {
    it('returns a hit on natural 20', () => {
      const result = engine.calculateDamageRoll(5, 30);
      if (result.attackRoll === 20) {
        expect(result.hit).toBe(true);
        expect(result.critical).toBe(true);
      }
    });

    it('returns a miss on natural 1', () => {
      const result = engine.calculateDamageRoll(5, 10);
      if (result.attackRoll === 1) {
        expect(result.hit).toBe(false);
      }
    });

    it('includes attack modifier in attack total', () => {
      const result = engine.calculateDamageRoll(5, 10);
      expect(result.attackTotal).toBe(result.attackRoll + 5);
    });

    it('damage is at least 1 on hit', () => {
      for (let i = 0; i < 50; i++) {
        const result = engine.calculateDamageRoll(0, 5);
        if (result.hit) {
          expect(result.damageTotal).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it('critical hits roll 2d6 damage', () => {
      for (let i = 0; i < 100; i++) {
        const result = engine.calculateDamageRoll(100, 5);
        if (result.critical) {
          expect(result.damageRolls).toHaveLength(2);
          break;
        }
      }
    });

    it('normal hits roll 1d6 damage', () => {
      for (let i = 0; i < 100; i++) {
        const result = engine.calculateDamageRoll(100, 5);
        if (result.hit && !result.critical) {
          expect(result.damageRolls).toHaveLength(1);
          break;
        }
      }
    });
  });

  describe('calculateSkillCheck', () => {
    it('returns correct modifier with proficiency', () => {
      const result = engine.calculateSkillCheck(14, 15, true, 1);
      expect(result.modifier).toBe(abilityModifier(14) + proficiencyBonus(1));
    });

    it('returns correct modifier without proficiency', () => {
      const result = engine.calculateSkillCheck(14, 15, false, 1);
      expect(result.modifier).toBe(abilityModifier(14));
    });

    it('natural 20 is always a critical success', () => {
      for (let i = 0; i < 100; i++) {
        const result = engine.calculateSkillCheck(1, 30, false, 1);
        if (result.roll === 20) {
          expect(result.criticalSuccess).toBe(true);
          expect(result.success).toBe(true);
          break;
        }
      }
    });

    it('natural 1 is always a critical failure', () => {
      for (let i = 0; i < 100; i++) {
        const result = engine.calculateSkillCheck(20, 1, true, 20);
        if (result.roll === 1) {
          expect(result.criticalFailure).toBe(true);
          expect(result.success).toBe(false);
          break;
        }
      }
    });
  });

  describe('calculateSavingThrow', () => {
    it('returns correct modifier with proficiency', () => {
      const result = engine.calculateSavingThrow(16, 15, true, 5);
      expect(result.modifier).toBe(abilityModifier(16) + proficiencyBonus(5));
    });

    it('returns correct modifier without proficiency', () => {
      const result = engine.calculateSavingThrow(16, 15, false, 5);
      expect(result.modifier).toBe(abilityModifier(16));
    });

    it('natural 20 is always a success', () => {
      for (let i = 0; i < 100; i++) {
        const result = engine.calculateSavingThrow(1, 30, false, 1);
        if (result.roll === 20) {
          expect(result.criticalSuccess).toBe(true);
          expect(result.success).toBe(true);
          break;
        }
      }
    });

    it('natural 1 is always a failure', () => {
      for (let i = 0; i < 100; i++) {
        const result = engine.calculateSavingThrow(20, 1, true, 20);
        if (result.roll === 1) {
          expect(result.criticalFailure).toBe(true);
          expect(result.success).toBe(false);
          break;
        }
      }
    });
  });

  describe('getEngine factory', () => {
    it('returns DnD5eEngine for dnd5e', () => {
      const eng = getEngine('dnd5e');
      expect(eng).toBeInstanceOf(DnD5eEngine);
    });
  });
});
