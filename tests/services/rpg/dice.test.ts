import { describe, expect, it } from 'bun:test';
import {
  roll,
  rollMultiple,
  rollWithModifier,
  parseDiceNotation,
  rollFromNotation,
} from '../../../src/services/rpg/dice';

describe('DiceRoller', () => {
  describe('roll', () => {
    it('returns a number between 1 and sides', () => {
      for (let i = 0; i < 100; i++) {
        const result = roll(6);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
      }
    });

    it('returns 1 for a 1-sided die', () => {
      expect(roll(1)).toBe(1);
    });

    it('throws for sides < 1', () => {
      expect(() => roll(0)).toThrow();
      expect(() => roll(-1)).toThrow();
    });

    it('works with d20', () => {
      const result = roll(20);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(20);
    });
  });

  describe('rollMultiple', () => {
    it('returns the correct number of rolls', () => {
      const results = rollMultiple(4, 6);
      expect(results).toHaveLength(4);
    });

    it('each roll is within valid range', () => {
      const results = rollMultiple(10, 8);
      for (const r of results) {
        expect(r).toBeGreaterThanOrEqual(1);
        expect(r).toBeLessThanOrEqual(8);
      }
    });

    it('throws for count < 1', () => {
      expect(() => rollMultiple(0, 6)).toThrow();
      expect(() => rollMultiple(-1, 6)).toThrow();
    });
  });

  describe('rollWithModifier', () => {
    it('returns correct total with positive modifier', () => {
      const result = rollWithModifier(2, 6, 3);
      const expectedTotal = result.rolls.reduce((sum, r) => sum + r, 0) + 3;
      expect(result.total).toBe(expectedTotal);
      expect(result.modifier).toBe(3);
      expect(result.rolls).toHaveLength(2);
    });

    it('returns correct total with negative modifier', () => {
      const result = rollWithModifier(1, 20, -2);
      const expectedTotal = result.rolls.reduce((sum, r) => sum + r, 0) - 2;
      expect(result.total).toBe(expectedTotal);
      expect(result.modifier).toBe(-2);
    });

    it('returns correct total with zero modifier', () => {
      const result = rollWithModifier(3, 6, 0);
      const expectedTotal = result.rolls.reduce((sum, r) => sum + r, 0);
      expect(result.total).toBe(expectedTotal);
      expect(result.modifier).toBe(0);
    });

    it('includes notation in result', () => {
      const result = rollWithModifier(2, 6, 3);
      expect(result.notation).toEqual({ count: 2, sides: 6, modifier: 3 });
    });
  });

  describe('parseDiceNotation', () => {
    it('parses basic notation without modifier', () => {
      expect(parseDiceNotation('1d20')).toEqual({ count: 1, sides: 20, modifier: 0 });
      expect(parseDiceNotation('2d6')).toEqual({ count: 2, sides: 6, modifier: 0 });
      expect(parseDiceNotation('4d8')).toEqual({ count: 4, sides: 8, modifier: 0 });
    });

    it('parses notation with positive modifier', () => {
      expect(parseDiceNotation('2d6+3')).toEqual({ count: 2, sides: 6, modifier: 3 });
      expect(parseDiceNotation('1d20+5')).toEqual({ count: 1, sides: 20, modifier: 5 });
    });

    it('parses notation with negative modifier', () => {
      expect(parseDiceNotation('1d20-2')).toEqual({ count: 1, sides: 20, modifier: -2 });
      expect(parseDiceNotation('3d6-1')).toEqual({ count: 3, sides: 6, modifier: -1 });
    });

    it('handles whitespace', () => {
      expect(parseDiceNotation('  2d6+3  ')).toEqual({ count: 2, sides: 6, modifier: 3 });
    });

    it('is case-insensitive', () => {
      expect(parseDiceNotation('2D6+3')).toEqual({ count: 2, sides: 6, modifier: 3 });
    });

    it('throws for invalid notation', () => {
      expect(() => parseDiceNotation('')).toThrow();
      expect(() => parseDiceNotation('d20')).toThrow();
      expect(() => parseDiceNotation('1d')).toThrow();
      expect(() => parseDiceNotation('abc')).toThrow();
      expect(() => parseDiceNotation('2d6+3+1')).toThrow();
      expect(() => parseDiceNotation('0d6')).toThrow();
      expect(() => parseDiceNotation('1d0')).toThrow();
    });
  });

  describe('rollFromNotation', () => {
    it('parses and rolls correctly', () => {
      const result = rollFromNotation('2d6+3');
      expect(result.rolls).toHaveLength(2);
      expect(result.modifier).toBe(3);
      expect(result.total).toBe(result.rolls.reduce((sum, r) => sum + r, 0) + 3);
    });

    it('works with simple notation', () => {
      const result = rollFromNotation('1d20');
      expect(result.rolls).toHaveLength(1);
      expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
      expect(result.rolls[0]).toBeLessThanOrEqual(20);
      expect(result.modifier).toBe(0);
    });

    it('throws for invalid notation', () => {
      expect(() => rollFromNotation('invalid')).toThrow();
    });
  });
});
