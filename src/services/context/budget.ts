export const MAX_CONTEXT = 32000;
export const SYSTEM_PROMPT_BUDGET = 2000;
export const WORLD_STATE_BUDGET = 4000;
export const RECENT_MESSAGES_BUDGET = 10000;
export const RAG_BUDGET = 12000;
export const RESPONSE_HEADROOM = 4000;

export interface TokenBreakdown {
  systemPrompt: number;
  worldState: number;
  recentMessages: number;
  ragResults: number;
  responseHeadroom: number;
}

export interface AllocationResult {
  allocated: TokenBreakdown;
  remaining: number;
  total: number;
}

export function allocate(breakdown: Partial<TokenBreakdown>): AllocationResult {
  const allocated: TokenBreakdown = {
    systemPrompt: breakdown.systemPrompt ?? SYSTEM_PROMPT_BUDGET,
    worldState: breakdown.worldState ?? WORLD_STATE_BUDGET,
    recentMessages: breakdown.recentMessages ?? RECENT_MESSAGES_BUDGET,
    ragResults: breakdown.ragResults ?? RAG_BUDGET,
    responseHeadroom: breakdown.responseHeadroom ?? RESPONSE_HEADROOM,
  };

  const total =
    allocated.systemPrompt +
    allocated.worldState +
    allocated.recentMessages +
    allocated.ragResults +
    allocated.responseHeadroom;

  const remaining = MAX_CONTEXT - total;

  return { allocated, remaining, total };
}

export function isWithinBudget(totalTokens: number): boolean {
  return totalTokens <= MAX_CONTEXT - RESPONSE_HEADROOM;
}

export function maxUsableTokens(): number {
  return MAX_CONTEXT - RESPONSE_HEADROOM;
}
