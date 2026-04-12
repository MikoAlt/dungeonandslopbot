import { describe, expect, it, beforeEach, vi } from 'bun:test';
import { DiceCli } from '../../../src/services/rpg/dice-cli';

describe('DiceCli', () => {
  describe('dice command integration', () => {
    it('parses simple dice notation correctly', () => {
      const cli = new DiceCli();
      const result = cli.roll('2d6+3');

      expect(result.notation).toBe('2d6+3');
      expect(result.rolls).toHaveLength(2);
      expect(result.modifier).toBe(3);
      expect(result.total).toBe(result.rolls.reduce((s, r) => s + r, 0) + 3);
    });

    it('handles advantage notation', () => {
      const cli = new DiceCli();
      const result = cli.roll('1d20 advantage');

      expect(result.notation).toContain('advantage');
      expect(result.rolls).toHaveLength(2);
      expect(result.dropped).toHaveLength(1);
    });

    it('handles disadvantage notation', () => {
      const cli = new DiceCli();
      const result = cli.roll('1d20 disadvantage');

      expect(result.notation).toContain('disadvantage');
      expect(result.rolls).toHaveLength(2);
      expect(result.dropped).toHaveLength(1);
    });

    it('handles keep highest notation', () => {
      const cli = new DiceCli();
      const result = cli.roll('4d6kh3');

      expect(result.notation).toBe('4d6kh3');
      expect(result.rolls).toHaveLength(3);
      expect(result.dropped).toHaveLength(1);
    });

    it('handles exploding dice notation', () => {
      const cli = new DiceCli();
      const result = cli.roll('1d6!crit');

      expect(result.notation).toBe('1d6!crit');
    });

    it('throws for invalid notation', () => {
      const cli = new DiceCli();

      expect(() => cli.roll('')).toThrow();
      expect(() => cli.roll('abc')).toThrow();
      expect(() => cli.roll('d20')).toThrow();
    });
  });
});
