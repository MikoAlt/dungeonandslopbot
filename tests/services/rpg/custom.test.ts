import { describe, expect, it } from 'bun:test';
import { CustomEngine } from '../../../src/services/rpg/custom';
import { getEngine } from '../../../src/services/rpg/engine';
import type { CustomSimpleStats } from '../../../src/types/character';

describe('CustomEngine', () => {
  const engine = new CustomEngine();

  describe('createDefaultStats', () => {
    it('returns default stats', () => {
      const stats = engine.createDefaultStats();
      expect(stats.hp).toBe(100);
      expect(stats.attack).toBe(10);
      expect(stats.defense).toBe(10);
      expect(stats.speed).toBe(5);
      expect(stats.special).toEqual([]);
    });
  });

  describe('validateStats', () => {
    it('validates correct stats', () => {
      const stats = engine.createDefaultStats();
      const result = engine.validateStats(stats);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects negative hp', () => {
      const stats: CustomSimpleStats = { hp: -1, attack: 10, defense: 10, speed: 5, special: [] };
      const result = engine.validateStats(stats);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('hp'))).toBe(true);
    });

    it('rejects negative attack', () => {
      const stats: CustomSimpleStats = { hp: 100, attack: -1, defense: 10, speed: 5, special: [] };
      const result = engine.validateStats(stats);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('attack'))).toBe(true);
    });

    it('rejects negative defense', () => {
      const stats: CustomSimpleStats = { hp: 100, attack: 10, defense: -1, speed: 5, special: [] };
      const result = engine.validateStats(stats);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('defense'))).toBe(true);
    });

    it('rejects negative speed', () => {
      const stats: CustomSimpleStats = { hp: 100, attack: 10, defense: 10, speed: -1, special: [] };
      const result = engine.validateStats(stats);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('speed'))).toBe(true);
    });

    it('rejects unreasonably high hp', () => {
      const stats: CustomSimpleStats = {
        hp: 10000,
        attack: 10,
        defense: 10,
        speed: 5,
        special: [],
      };
      const result = engine.validateStats(stats);
      expect(result.valid).toBe(false);
    });

    it('rejects unreasonably high attack', () => {
      const stats: CustomSimpleStats = {
        hp: 100,
        attack: 1000,
        defense: 10,
        speed: 5,
        special: [],
      };
      const result = engine.validateStats(stats);
      expect(result.valid).toBe(false);
    });

    it('rejects unreasonably high defense', () => {
      const stats: CustomSimpleStats = {
        hp: 100,
        attack: 10,
        defense: 1000,
        speed: 5,
        special: [],
      };
      const result = engine.validateStats(stats);
      expect(result.valid).toBe(false);
    });

    it('collects multiple errors', () => {
      const stats: CustomSimpleStats = { hp: -1, attack: -1, defense: -1, speed: -1, special: [] };
      const result = engine.validateStats(stats);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('applyLevelUp', () => {
    it('increases hp on hp choice', () => {
      const stats = engine.createDefaultStats();
      const result = engine.applyLevelUp(stats, 2, 'hp');
      expect(result.hpGained).toBeGreaterThanOrEqual(6);
      expect(result.hpGained).toBeLessThanOrEqual(15);
      expect(result.stats.hp).toBe(stats.hp + result.hpGained);
    });

    it('increases attack on attack choice', () => {
      const stats = engine.createDefaultStats();
      const result = engine.applyLevelUp(stats, 2, 'attack');
      expect(result.stats.attack).toBe(stats.attack + 2);
      expect(result.hpGained).toBe(0);
    });

    it('increases defense on defense choice', () => {
      const stats = engine.createDefaultStats();
      const result = engine.applyLevelUp(stats, 2, 'defense');
      expect(result.stats.defense).toBe(stats.defense + 2);
      expect(result.hpGained).toBe(0);
    });

    it('defaults to hp choice', () => {
      const stats = engine.createDefaultStats();
      const result = engine.applyLevelUp(stats, 2);
      expect(result.hpGained).toBeGreaterThanOrEqual(6);
    });

    it('never sets asiAvailable to true (custom system)', () => {
      const stats = engine.createDefaultStats();
      const result = engine.applyLevelUp(stats, 4, 'hp');
      expect(result.asiAvailable).toBe(false);
    });
  });

  describe('calculateDamageRoll', () => {
    it('returns a result with all required fields', () => {
      const result = engine.calculateDamageRoll(10, 10);
      expect(result).toHaveProperty('attackRoll');
      expect(result).toHaveProperty('attackTotal');
      expect(result).toHaveProperty('hit');
      expect(result).toHaveProperty('critical');
      expect(result).toHaveProperty('damageRolls');
      expect(result).toHaveProperty('damageTotal');
    });

    it('natural 20 is always a critical hit', () => {
      for (let i = 0; i < 100; i++) {
        const result = engine.calculateDamageRoll(10, 100);
        if (result.attackRoll === 20) {
          expect(result.critical).toBe(true);
          expect(result.hit).toBe(true);
          break;
        }
      }
    });

    it('natural 1 is always a miss', () => {
      for (let i = 0; i < 100; i++) {
        const result = engine.calculateDamageRoll(100, 1);
        if (result.attackRoll === 1) {
          expect(result.hit).toBe(false);
          break;
        }
      }
    });

    it('damage is at least 1 on hit', () => {
      for (let i = 0; i < 50; i++) {
        const result = engine.calculateDamageRoll(1, 100);
        if (result.hit) {
          expect(result.damageTotal).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it('critical hits add extra damage', () => {
      for (let i = 0; i < 200; i++) {
        const result = engine.calculateDamageRoll(100, 1);
        if (result.critical) {
          expect(result.damageRolls.length).toBeGreaterThanOrEqual(3);
          break;
        }
      }
    });

    it('attack total includes attack stat', () => {
      const result = engine.calculateDamageRoll(10, 10);
      expect(result.attackTotal).toBe(result.attackRoll + 10);
    });
  });

  describe('calculateSkillCheck', () => {
    it('returns correct structure', () => {
      const result = engine.calculateSkillCheck(10, 15);
      expect(result).toHaveProperty('roll');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('modifier');
      expect(result).toHaveProperty('difficulty');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('criticalSuccess');
      expect(result).toHaveProperty('criticalFailure');
    });

    it('modifier equals the stat value', () => {
      const result = engine.calculateSkillCheck(10, 15);
      expect(result.modifier).toBe(10);
    });

    it('total equals roll + stat', () => {
      const result = engine.calculateSkillCheck(10, 15);
      expect(result.total).toBe(result.roll + 10);
    });

    it('natural 20 is always a success', () => {
      for (let i = 0; i < 100; i++) {
        const result = engine.calculateSkillCheck(1, 100);
        if (result.roll === 20) {
          expect(result.criticalSuccess).toBe(true);
          expect(result.success).toBe(true);
          break;
        }
      }
    });

    it('natural 1 is always a failure', () => {
      for (let i = 0; i < 100; i++) {
        const result = engine.calculateSkillCheck(100, 1);
        if (result.roll === 1) {
          expect(result.criticalFailure).toBe(true);
          expect(result.success).toBe(false);
          break;
        }
      }
    });
  });

  describe('getEngine factory', () => {
    it('returns CustomEngine for custom', () => {
      const eng = getEngine('custom');
      expect(eng).toBeInstanceOf(CustomEngine);
    });
  });
});
