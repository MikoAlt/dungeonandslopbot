import { describe, expect, it } from 'bun:test';
import { createSeededRandom } from '../../src/utils/random';

describe('createSeededRandom', () => {
  describe('next()', () => {
    it('returns float in [0, 1)', () => {
      const rng = createSeededRandom(12345);
      for (let i = 0; i < 100; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('produces deterministic sequence for same seed', () => {
      const rng1 = createSeededRandom(42);
      const rng2 = createSeededRandom(42);

      const seq1: number[] = [];
      const seq2: number[] = [];

      for (let i = 0; i < 10; i++) {
        seq1.push(rng1.next());
        seq2.push(rng2.next());
      }

      expect(seq1).toEqual(seq2);
    });

    it('produces different sequences for different seeds', () => {
      const rng1 = createSeededRandom(42);
      const rng2 = createSeededRandom(123);

      const seq1: number[] = [];
      const seq2: number[] = [];

      for (let i = 0; i < 10; i++) {
        seq1.push(rng1.next());
        seq2.push(rng2.next());
      }

      expect(seq1).not.toEqual(seq2);
    });
  });

  describe('nextInt(min, max)', () => {
    it('returns integer in [min, max] inclusive', () => {
      const rng = createSeededRandom(12345);
      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(1, 6);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(6);
      }
    });

    it('returns min when min equals max', () => {
      const rng = createSeededRandom(12345);
      for (let i = 0; i < 10; i++) {
        expect(rng.nextInt(5, 5)).toBe(5);
      }
    });

    it('works with negative ranges', () => {
      const rng = createSeededRandom(12345);
      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(-3, 3);
        expect(value).toBeGreaterThanOrEqual(-3);
        expect(value).toBeLessThanOrEqual(3);
      }
    });

    it('is deterministic for same seed', () => {
      const rng1 = createSeededRandom(999);
      const rng2 = createSeededRandom(999);

      const seq1: number[] = [];
      const seq2: number[] = [];

      for (let i = 0; i < 10; i++) {
        seq1.push(rng1.nextInt(1, 20));
        seq2.push(rng2.nextInt(1, 20));
      }

      expect(seq1).toEqual(seq2);
    });

    it('throws for min > max', () => {
      const rng = createSeededRandom(12345);
      expect(() => rng.nextInt(10, 5)).toThrow();
    });

    it('throws for non-finite min or max', () => {
      const rng = createSeededRandom(12345);
      expect(() => rng.nextInt(Infinity, 5)).toThrow();
      expect(() => rng.nextInt(1, Infinity)).toThrow();
      expect(() => rng.nextInt(NaN, 5)).toThrow();
    });
  });

  describe('distribution', () => {
    it('approximately uniform distribution for d20', () => {
      const rng = createSeededRandom(54321);
      const counts = new Array(20).fill(0);
      const iterations = 20000;

      for (let i = 0; i < iterations; i++) {
        const roll = rng.nextInt(1, 20);
        counts[roll - 1]++;
      }

      const expected = iterations / 20;
      const tolerance = expected * 0.15;

      for (let i = 0; i < 20; i++) {
        expect(counts[i]).toBeGreaterThan(expected - tolerance);
        expect(counts[i]).toBeLessThan(expected + tolerance);
      }
    });
  });
});
