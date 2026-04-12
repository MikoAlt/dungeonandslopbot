export const CommandType = {
  DICE: 'dice',
  STORY: 'story',
  CHARACTER: 'character',
  CAMPAIGN: 'campaign',
  COMBAT: 'combat',
} as const;

export type CommandType = (typeof CommandType)[keyof typeof CommandType];

export interface RateLimitConfig {
  maxTokens: number;
  refillRate: number;
  refillIntervalMs: number;
}

function envOverride(
  key: keyof typeof CommandType,
  field: 'maxTokens' | 'refillRate' | 'refillIntervalMs',
  defaultValue: number,
): number {
  const envKey = `RATE_LIMIT_${key.toUpperCase()}_${field.toUpperCase()}`;
  const envValue = process.env[envKey];
  if (envValue !== undefined) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return defaultValue;
}

export const RATE_LIMITS: Record<CommandType, RateLimitConfig> = {
  [CommandType.DICE]: {
    maxTokens: envOverride(CommandType.DICE, 'maxTokens', 10),
    refillRate: envOverride(CommandType.DICE, 'refillRate', 10),
    refillIntervalMs: envOverride(CommandType.DICE, 'refillIntervalMs', 60_000),
  },
  [CommandType.STORY]: {
    maxTokens: envOverride(CommandType.STORY, 'maxTokens', 5),
    refillRate: envOverride(CommandType.STORY, 'refillRate', 5),
    refillIntervalMs: envOverride(CommandType.STORY, 'refillIntervalMs', 60_000),
  },
  [CommandType.CHARACTER]: {
    maxTokens: envOverride(CommandType.CHARACTER, 'maxTokens', 20),
    refillRate: envOverride(CommandType.CHARACTER, 'refillRate', 20),
    refillIntervalMs: envOverride(CommandType.CHARACTER, 'refillIntervalMs', 60_000),
  },
  [CommandType.CAMPAIGN]: {
    maxTokens: envOverride(CommandType.CAMPAIGN, 'maxTokens', 10),
    refillRate: envOverride(CommandType.CAMPAIGN, 'refillRate', 10),
    refillIntervalMs: envOverride(CommandType.CAMPAIGN, 'refillIntervalMs', 60_000),
  },
  [CommandType.COMBAT]: {
    maxTokens: envOverride(CommandType.COMBAT, 'maxTokens', 15),
    refillRate: envOverride(CommandType.COMBAT, 'refillRate', 15),
    refillIntervalMs: envOverride(CommandType.COMBAT, 'refillIntervalMs', 60_000),
  },
};
