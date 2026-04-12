/**
 * Seeded PRNG using mulberry32 algorithm.
 * Fast, good distribution, simple implementation.
 */

export interface SeededRandom {
  next(): number;
  nextInt(min: number, max: number): number;
}

/**
 * Creates a seeded random number generator using mulberry32 algorithm.
 * @param seed - Initial seed value
 * @returns SeededRandom instance with next() and nextInt() methods
 */
export function createSeededRandom(seed: number): SeededRandom {
  let state = seed >>> 0;

  return {
    next(): number {
      // Mulberry32 algorithm
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },

    nextInt(min: number, max: number): number {
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        throw new Error('min and max must be finite numbers');
      }
      if (min > max) {
        throw new Error('min must be less than or equal to max');
      }
      const inclusiveRange = max - min + 1;
      return Math.floor(this.next() * inclusiveRange) + min;
    },
  };
}
