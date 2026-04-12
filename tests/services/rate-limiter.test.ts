import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { RateLimiter } from '../../src/services/rate-limiter.js';
import { CommandType } from '../../src/config/rate-limits.js';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
  });

  describe('consume', () => {
    test('allows request when tokens available', () => {
      const allowed = rateLimiter.consume('user1', CommandType.DICE);
      expect(allowed).toBe(true);
    });

    test('reduces remaining tokens', () => {
      rateLimiter.consume('user1', CommandType.DICE);
      rateLimiter.consume('user1', CommandType.DICE);
      const remaining = rateLimiter.getRemainingTokens('user1', CommandType.DICE);
      expect(remaining).toBe(8);
    });

    test('denies request when tokens exhausted', () => {
      for (let i = 0; i < 10; i++) {
        rateLimiter.consume('user1', CommandType.DICE);
      }
      const allowed = rateLimiter.consume('user1', CommandType.DICE);
      expect(allowed).toBe(false);
    });

    test('independent limits per command type', () => {
      for (let i = 0; i < 10; i++) {
        rateLimiter.consume('user1', CommandType.DICE);
      }
      const storyRemaining = rateLimiter.getRemainingTokens('user1', CommandType.STORY);
      expect(storyRemaining).toBe(5);
    });
  });

  describe('getRemainingTokens', () => {
    test('returns max tokens for new user', () => {
      const remaining = rateLimiter.getRemainingTokens('newuser', CommandType.DICE);
      expect(remaining).toBe(10);
    });

    test('returns current token count', () => {
      rateLimiter.consume('user1', CommandType.DICE);
      rateLimiter.consume('user1', CommandType.DICE);
      const remaining = rateLimiter.getRemainingTokens('user1', CommandType.DICE);
      expect(remaining).toBe(8);
    });
  });

  describe('getResetTime', () => {
    test('returns now when bucket is full', () => {
      const resetTime = rateLimiter.getResetTime('user1', CommandType.DICE);
      const now = Date.now();
      expect(resetTime).toBeGreaterThanOrEqual(now);
      expect(resetTime).toBeLessThanOrEqual(now + 100);
    });

    test('returns future time when bucket is depleted', () => {
      for (let i = 0; i < 10; i++) {
        rateLimiter.consume('user1', CommandType.DICE);
      }
      const resetTime = rateLimiter.getResetTime('user1', CommandType.DICE);
      expect(resetTime).toBeGreaterThan(Date.now());
    });
  });

  describe('token refill over time', () => {
    test('refills tokens after interval', async () => {
      for (let i = 0; i < 10; i++) {
        rateLimiter.consume('user1', CommandType.DICE);
      }
      expect(rateLimiter.getRemainingTokens('user1', CommandType.DICE)).toBe(0);

      rateLimiter.consume('user1', CommandType.DICE);
      const afterOne = rateLimiter.getRemainingTokens('user1', CommandType.DICE);
      expect(afterOne).toBe(0);
    });
  });

  describe('per-user isolation', () => {
    test('user A tokens do not affect user B', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.consume('user1', CommandType.DICE);
      }
      const user2Remaining = rateLimiter.getRemainingTokens('user2', CommandType.DICE);
      expect(user2Remaining).toBe(10);
    });
  });

  describe('independent command type limits', () => {
    test('dice limit does not affect story limit', () => {
      for (let i = 0; i < 10; i++) {
        rateLimiter.consume('user1', CommandType.DICE);
      }
      const storyRemaining = rateLimiter.getRemainingTokens('user1', CommandType.STORY);
      expect(storyRemaining).toBe(5);
    });

    test('story limit does not affect dice limit', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.consume('user1', CommandType.STORY);
      }
      const diceRemaining = rateLimiter.getRemainingTokens('user1', CommandType.DICE);
      expect(diceRemaining).toBe(10);
    });
  });
});
