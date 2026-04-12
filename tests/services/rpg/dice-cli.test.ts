import { describe, expect, it } from 'bun:test';
import { DiceCli } from '../../../src/services/rpg/dice-cli';
import { createSeededRandom } from '../../../src/utils/random';

describe('DiceCli', () => {
  describe('basic dice parsing', () => {
    it('parses simple dice notation', () => {
      const rng = createSeededRandom(12345);
      const cli = new DiceCli(rng);
      const result = cli.roll('2d6+3');

      expect(result.notation).toBe('2d6+3');
      expect(result.rolls).toHaveLength(2);
      expect(result.dropped).toHaveLength(0);
      expect(result.modifier).toBe(3);
      expect(result.total).toBe(result.rolls.reduce((s, r) => s + r, 0) + 3);
    });

    it('parses notation without modifier', () => {
      const rng = createSeededRandom(12345);
      const cli = new DiceCli(rng);
      const result = cli.roll('1d20');

      expect(result.notation).toBe('1d20');
      expect(result.rolls).toHaveLength(1);
      expect(result.dropped).toHaveLength(0);
      expect(result.modifier).toBe(0);
    });

    it('handles whitespace', () => {
      const rng = createSeededRandom(12345);
      const cli = new DiceCli(rng);
      const result = cli.roll('  2d6 + 3  ');

      expect(result.notation).toBe('2d6 + 3');
    });

    it('is case-insensitive', () => {
      const rng = createSeededRandom(12345);
      const cli = new DiceCli(rng);
      const result = cli.roll('2D6+3');

      expect(result.rolls).toHaveLength(2);
    });
  });

  describe('advantage/disadvantage', () => {
    it('rolls with advantage (takes higher)', () => {
      const rng = createSeededRandom(42);
      const cli = new DiceCli(rng);
      const result = cli.roll('1d20 advantage');

      expect(result.notation).toBe('1d20 advantage');
      expect(result.rolls).toHaveLength(2);
      expect(result.dropped).toHaveLength(1);
      expect(result.total).toBe(Math.max(result.rolls[0]!, result.rolls[1]!));
    });

    it('rolls with disadvantage (takes lower)', () => {
      const rng = createSeededRandom(42);
      const cli = new DiceCli(rng);
      const result = cli.roll('1d20 disadvantage');

      expect(result.notation).toBe('1d20 disadvantage');
      expect(result.rolls).toHaveLength(2);
      expect(result.dropped).toHaveLength(1);
      expect(result.total).toBe(Math.min(result.rolls[0]!, result.rolls[1]!));
    });

    it('marks isCrit when max roll is kept', () => {
      const rng = createSeededRandom(1);
      const cli = new DiceCli(rng);

      let isCritFound = false;
      for (let i = 0; i < 1000; i++) {
        const result = cli.roll('1d20 advantage');
        if (result.isCrit) {
          isCritFound = true;
          expect(result.rolls.some((r) => r === 20)).toBe(true);
          break;
        }
      }
      expect(isCritFound).toBe(true);
    });

    it('marks isFumble when min roll is kept', () => {
      const rng = createSeededRandom(999);
      const cli = new DiceCli(rng);

      let isFumbleFound = false;
      for (let i = 0; i < 1000; i++) {
        const result = cli.roll('1d20 advantage');
        if (result.isFumble) {
          isFumbleFound = true;
          expect(result.rolls.some((r) => r === 1)).toBe(true);
          break;
        }
      }
      expect(isFumbleFound).toBe(true);
    });
  });

  describe('keep highest/lowest (kh/kl)', () => {
    it('keeps highest 3 (4d6kh3)', () => {
      const rng = createSeededRandom(42);
      const cli = new DiceCli(rng);
      const result = cli.roll('4d6kh3');

      expect(result.notation).toBe('4d6kh3');
      expect(result.rolls).toHaveLength(3);
      expect(result.dropped).toHaveLength(1);
      expect(result.total).toBe(result.rolls.reduce((s, r) => s + r, 0));
    });

    it('keeps lowest 3 (4d6kl3)', () => {
      const rng = createSeededRandom(42);
      const cli = new DiceCli(rng);
      const result = cli.roll('4d6kl3');

      expect(result.notation).toBe('4d6kl3');
      expect(result.rolls).toHaveLength(3);
      expect(result.dropped).toHaveLength(1);
      expect(result.total).toBe(result.rolls.reduce((s, r) => s + r, 0));
    });

    it('sorts correctly for kh', () => {
      const rng = createSeededRandom(12345);
      const cli = new DiceCli(rng);
      const result = cli.roll('4d6kh3');

      const sortedKept = [...result.rolls].sort((a, b) => b - a);
      expect(result.rolls).toEqual(sortedKept);
    });

    it('sorts correctly for kl', () => {
      const rng = createSeededRandom(12345);
      const cli = new DiceCli(rng);
      const result = cli.roll('4d6kl3');

      const sortedKept = [...result.rolls].sort((a, b) => a - b);
      expect(result.rolls).toEqual(sortedKept);
    });
  });

  describe('exploding dice (!crit)', () => {
    it('rolls additional dice on max roll', () => {
      const rng = createSeededRandom(1);
      const cli = new DiceCli(rng);
      const result = cli.roll('1d6!crit');

      expect(result.notation).toBe('1d6!crit');
      if (result.rolls[0] === 6) {
        expect(result.rolls.length).toBeGreaterThan(1);
      }
    });

    it('handles multiple exploding dice', () => {
      const rng = createSeededRandom(42);
      const cli = new DiceCli(rng);
      const result = cli.roll('2d6!crit');

      let maxCount = 0;
      let hasExploding = false;
      for (let i = 0; i < result.rolls.length; i++) {
        if (result.rolls[i] === 6) {
          hasExploding = true;
          maxCount++;
        }
      }
      if (hasExploding) {
        expect(result.rolls.length).toBeGreaterThan(2);
      }
    });

    it('marks isCrit when max value rolled', () => {
      const rng = createSeededRandom(1);
      const cli = new DiceCli(rng);

      let hasCrit = false;
      for (let i = 0; i < 100; i++) {
        const result = cli.roll('1d6!crit');
        if (result.isCrit) {
          hasCrit = true;
          expect(result.rolls.includes(6)).toBe(true);
          break;
        }
      }
      expect(hasCrit).toBe(true);
    });
  });

  describe('error handling', () => {
    it('throws for invalid notation', () => {
      const rng = createSeededRandom(12345);
      const cli = new DiceCli(rng);

      expect(() => cli.roll('')).toThrow();
      expect(() => cli.roll('d20')).toThrow();
      expect(() => cli.roll('1d')).toThrow();
      expect(() => cli.roll('abc')).toThrow();
      expect(() => cli.roll('0d6')).toThrow();
      expect(() => cli.roll('1d0')).toThrow();
    });

    it('throws for invalid keep count', () => {
      const rng = createSeededRandom(12345);
      const cli = new DiceCli(rng);

      expect(() => cli.roll('2d6kh5')).toThrow();
      expect(() => cli.roll('2d6kh0')).toThrow();
    });
  });

  describe('deterministic rolling with seeded RNG', () => {
    it('produces consistent results with same seed', () => {
      const cli1 = new DiceCli(createSeededRandom(777));
      const cli2 = new DiceCli(createSeededRandom(777));

      const r1 = cli1.roll('2d6+3');
      const r2 = cli2.roll('2d6+3');

      expect(r1.rolls).toEqual(r2.rolls);
      expect(r1.total).toBe(r2.total);
    });

    it('produces different results with different seeds', () => {
      const cli1 = new DiceCli(createSeededRandom(777));
      const cli2 = new DiceCli(createSeededRandom(888));

      const r1 = cli1.roll('2d6+3');
      const r2 = cli2.roll('2d6+3');

      expect(r1.rolls).not.toEqual(r2.rolls);
    });

    it('is deterministic for complex notations', () => {
      const cli1 = new DiceCli(createSeededRandom(42));
      const cli2 = new DiceCli(createSeededRandom(42));

      const r1 = cli1.roll('1d20 advantage');
      const r2 = cli2.roll('1d20 advantage');

      expect(r1.rolls).toEqual(r2.rolls);
      expect(r1.total).toBe(r2.total);
    });
  });

  describe('roll values are valid', () => {
    it('all rolls are within valid range', () => {
      const rng = createSeededRandom(12345);
      const cli = new DiceCli(rng);

      const notations = ['1d20', '2d6+3', '1d20 advantage', '4d6kh3', '1d6!crit'];

      for (const notation of notations) {
        const result = cli.roll(notation);
        for (const roll of result.rolls) {
          expect(roll).toBeGreaterThanOrEqual(1);
          expect(roll).toBeLessThanOrEqual(20);
        }
      }
    });
  });
});
