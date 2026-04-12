import { describe, it, expect } from 'bun:test';
import {
  MAX_CONTEXT,
  SYSTEM_PROMPT_BUDGET,
  WORLD_STATE_BUDGET,
  RECENT_MESSAGES_BUDGET,
  RAG_BUDGET,
  RESPONSE_HEADROOM,
  allocate,
  isWithinBudget,
  maxUsableTokens,
} from '../../../src/services/context/budget';

describe('budget constants', () => {
  it('sums to MAX_CONTEXT', () => {
    const total =
      SYSTEM_PROMPT_BUDGET +
      WORLD_STATE_BUDGET +
      RECENT_MESSAGES_BUDGET +
      RAG_BUDGET +
      RESPONSE_HEADROOM;
    expect(total).toBe(MAX_CONTEXT);
  });

  it('has expected values', () => {
    expect(SYSTEM_PROMPT_BUDGET).toBe(2000);
    expect(WORLD_STATE_BUDGET).toBe(4000);
    expect(RECENT_MESSAGES_BUDGET).toBe(10000);
    expect(RAG_BUDGET).toBe(12000);
    expect(RESPONSE_HEADROOM).toBe(4000);
    expect(MAX_CONTEXT).toBe(32000);
  });
});

describe('allocate', () => {
  it('uses default budgets when no breakdown provided', () => {
    const result = allocate({});
    expect(result.allocated.systemPrompt).toBe(SYSTEM_PROMPT_BUDGET);
    expect(result.allocated.worldState).toBe(WORLD_STATE_BUDGET);
    expect(result.allocated.recentMessages).toBe(RECENT_MESSAGES_BUDGET);
    expect(result.allocated.ragResults).toBe(RAG_BUDGET);
    expect(result.allocated.responseHeadroom).toBe(RESPONSE_HEADROOM);
  });

  it('uses provided values over defaults', () => {
    const result = allocate({ systemPrompt: 1000, ragResults: 5000 });
    expect(result.allocated.systemPrompt).toBe(1000);
    expect(result.allocated.ragResults).toBe(5000);
    expect(result.allocated.worldState).toBe(WORLD_STATE_BUDGET);
  });

  it('calculates total correctly', () => {
    const result = allocate({});
    expect(result.total).toBe(MAX_CONTEXT);
  });

  it('calculates remaining tokens', () => {
    const result = allocate({ systemPrompt: 1000 });
    const expectedTotal =
      1000 + WORLD_STATE_BUDGET + RECENT_MESSAGES_BUDGET + RAG_BUDGET + RESPONSE_HEADROOM;
    expect(result.total).toBe(expectedTotal);
    expect(result.remaining).toBe(MAX_CONTEXT - expectedTotal);
  });

  it('returns zero remaining when all defaults used', () => {
    const result = allocate({});
    expect(result.remaining).toBe(0);
  });
});

describe('isWithinBudget', () => {
  it('returns true for tokens within usable budget', () => {
    expect(isWithinBudget(0)).toBe(true);
    expect(isWithinBudget(28000)).toBe(true);
  });

  it('returns false for tokens exceeding usable budget', () => {
    expect(isWithinBudget(28001)).toBe(false);
    expect(isWithinBudget(32000)).toBe(false);
  });

  it('uses MAX_CONTEXT minus RESPONSE_HEADROOM as limit', () => {
    expect(isWithinBudget(MAX_CONTEXT - RESPONSE_HEADROOM)).toBe(true);
    expect(isWithinBudget(MAX_CONTEXT - RESPONSE_HEADROOM + 1)).toBe(false);
  });
});

describe('maxUsableTokens', () => {
  it('returns MAX_CONTEXT minus RESPONSE_HEADROOM', () => {
    expect(maxUsableTokens()).toBe(28000);
  });
});
