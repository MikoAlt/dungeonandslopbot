import { CustomSimpleStatsSchema, type CustomSimpleStats } from '../../../types/character.js';

export type LevelUpChoice = 'attack' | 'defense';

export const DEFAULT_CUSTOM_STATS: CustomSimpleStats = {
  hp: 25,
  attack: 5,
  defense: 5,
  speed: 20,
  special: [],
};

export function validateStats(
  stats: unknown,
): { success: true; data: CustomSimpleStats } | { success: false; errors: string[] } {
  const result = CustomSimpleStatsSchema.safeParse(stats);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    return { success: false, errors };
  }

  const data = result.data;
  const businessErrors: string[] = [];
  if (data.hp <= 0) businessErrors.push('hp: must be greater than 0');
  if (data.speed <= 0) businessErrors.push('speed: must be greater than 0');

  if (businessErrors.length > 0) {
    return { success: false, errors: businessErrors };
  }

  return { success: true, data };
}

export function applyLevelUp(
  stats: CustomSimpleStats,
  choice: LevelUpChoice = 'attack',
): CustomSimpleStats {
  return {
    ...stats,
    hp: stats.hp + 10,
    attack: choice === 'attack' ? stats.attack + 2 : stats.attack,
    defense: choice === 'defense' ? stats.defense + 2 : stats.defense,
  };
}

/** Custom system: total XP for level N = 50 * N * (N - 1). */
export function getXpThresholdForLevel(level: number): number {
  if (level < 1) return 0;
  return 50 * level * (level - 1);
}
