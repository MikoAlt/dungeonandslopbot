import { DnD5eStatsSchema, type DnD5eStats } from '../../../types/character.js';

/** D&D 5e XP thresholds: index 0 = level 1 (0 XP), index 1 = level 2 (300 XP), etc. */
export const DND5E_XP_THRESHOLDS: readonly number[] = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000,
  195000, 225000, 265000, 305000, 355000,
] as const;

export const DEFAULT_DND5E_STATS: DnD5eStats = {
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
  ac: 10,
  speed: 30,
  hitDice: '1d10',
};

export interface ArmorData {
  baseAc: number;
  /** null = unlimited dex bonus. */
  maxDexBonus: number | null;
}

/** (score - 10) / 2, rounded down (D&D 5e standard). */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** Unarmored: 10 + dex. Armored: base + capped dex. */
export function calculateAc(armor: ArmorData | null, dexModifier: number): number {
  if (armor === null) {
    return 10 + dexModifier;
  }
  const dexBonus =
    armor.maxDexBonus !== null ? Math.min(dexModifier, armor.maxDexBonus) : dexModifier;
  return armor.baseAc + dexBonus;
}

/** Level 1: max hit die + con mod (min 1). Subsequent: avg hit die + con mod (min 1). */
export function calculateHitPoints(level: number, conModifier: number, hitDie: number): number {
  const avgHitDie = Math.floor(hitDie / 2) + 1;
  const firstLevelHp = Math.max(1, hitDie + conModifier);
  const subsequentLevelHp = Math.max(1, avgHitDie + conModifier);
  return firstLevelHp + (level - 1) * subsequentLevelHp;
}

export function validateStats(
  stats: unknown,
): { success: true; data: DnD5eStats } | { success: false; errors: string[] } {
  const result = DnD5eStatsSchema.safeParse(stats);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  return { success: false, errors };
}

/** 2 + floor((level - 1) / 4). */
export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((level - 1) / 4);
}

export function parseHitDice(hitDice: string): { count: number; size: number } {
  const match = hitDice.match(/^(\d+)d(\d+)$/);
  if (!match) {
    throw new Error(`Invalid hit dice format: ${hitDice}. Expected format: NdN (e.g., "1d10")`);
  }
  return { count: parseInt(match[1]!, 10), size: parseInt(match[2]!, 10) };
}

/** Level 1 = 0 XP, Level 2 = 300 XP, etc. Max level 20. */
export function getXpThresholdForLevel(level: number): number {
  if (level < 1) return DND5E_XP_THRESHOLDS[0]!;
  if (level > 20) return DND5E_XP_THRESHOLDS[19]!;
  return DND5E_XP_THRESHOLDS[level - 1]!;
}

export function getLevelForXp(xp: number): number {
  for (let i = DND5E_XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= DND5E_XP_THRESHOLDS[i]!) {
      return i + 1;
    }
  }
  return 1;
}
