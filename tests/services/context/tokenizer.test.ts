import { describe, it, expect } from 'bun:test';
import {
  countTokens,
  truncateToTokens,
  countMessageTokens,
} from '../../../src/services/context/tokenizer';

describe('countTokens', () => {
  it('returns 0 for empty string', () => {
    expect(countTokens('')).toBe(0);
  });

  it('estimates tokens at ~4 chars per token', () => {
    expect(countTokens('abcd')).toBe(1);
    expect(countTokens('abcdefgh')).toBe(2);
  });

  it('rounds up partial tokens', () => {
    expect(countTokens('abc')).toBe(1);
    expect(countTokens('abcde')).toBe(2);
  });

  it('handles long text', () => {
    const text = 'a'.repeat(4000);
    expect(countTokens(text)).toBe(1000);
  });

  it('handles unicode text', () => {
    expect(countTokens('hello world')).toBe(3);
  });
});

describe('truncateToTokens', () => {
  it('returns empty string for maxTokens <= 0', () => {
    expect(truncateToTokens('hello', 0)).toBe('');
    expect(truncateToTokens('hello', -1)).toBe('');
  });

  it('returns full text if within budget', () => {
    const text = 'hello world';
    expect(truncateToTokens(text, 100)).toBe(text);
  });

  it('truncates text that exceeds budget', () => {
    const text = 'a'.repeat(100);
    const result = truncateToTokens(text, 10);
    expect(result.length).toBeLessThanOrEqual(40);
  });

  it('prefers breaking at newline when available', () => {
    const text = 'a'.repeat(35) + '\n' + 'b'.repeat(30);
    const result = truncateToTokens(text, 10);
    // maxChars = 40, newline at 35, 35 > 40*0.8=32, so break at newline
    expect(result).toBe('a'.repeat(35));
  });

  it('prefers breaking at space when no newline near boundary', () => {
    const text = 'word '.repeat(20);
    const result = truncateToTokens(text, 5);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it('hard-truncates when no good break point exists', () => {
    const text = 'a'.repeat(200);
    const result = truncateToTokens(text, 5);
    expect(result.length).toBeLessThanOrEqual(20);
  });
});

describe('countMessageTokens', () => {
  it('adds role overhead to content tokens', () => {
    const content = 'hello world';
    const contentTokens = countTokens(content);
    const msgTokens = countMessageTokens(content, 'user');
    expect(msgTokens).toBe(contentTokens + 4);
  });

  it('handles empty content', () => {
    expect(countMessageTokens('', 'system')).toBe(4);
  });
});
