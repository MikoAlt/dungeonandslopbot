import type { DnD5eStats } from '../../types/character.js';
import { roll, rollMultiple } from './dice.js';
import type {
  DamageResult,
  SkillCheckResult,
  SavingThrowResult,
  LevelUpResult,
  RPGEngine,
} from './engine.js';

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((level - 1) / 4);
}

export function calculateAc(stats: DnD5eStats): number {
  return 10 + abilityModifier(stats.dex);
}

export class DnD5eEngine implements RPGEngine<DnD5eStats> {
  createDefaultStats(): DnD5eStats {
    const stats: DnD5eStats = {
      str: 15,
      dex: 14,
      con: 13,
      int: 12,
      wis: 10,
      cha: 8,
      ac: 10 + abilityModifier(14),
      speed: 30,
      hitDice: '1d8',
    };
    return stats;
  }

  validateStats(stats: DnD5eStats): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const key of ABILITY_KEYS) {
      const val = stats[key];
      if (!Number.isInteger(val) || val < 1 || val > 30) {
        errors.push(`${key} must be an integer between 1 and 30, got ${val}`);
      }
    }

    if (!Number.isInteger(stats.ac) || stats.ac < 0) {
      errors.push(`ac must be a non-negative integer, got ${stats.ac}`);
    }
    if (!Number.isInteger(stats.speed) || stats.speed < 0) {
      errors.push(`speed must be a non-negative integer, got ${stats.speed}`);
    }

    return { valid: errors.length === 0, errors };
  }

  applyLevelUp(stats: DnD5eStats, level: number): LevelUpResult {
    const conMod = abilityModifier(stats.con);
    const hitDieFaces = this.parseHitDieFaces(stats.hitDice);
    const hpRoll = roll(hitDieFaces);
    const hpGained = Math.max(1, hpRoll + conMod);

    const asiAvailable = [4, 8, 12, 16, 19].includes(level);

    const updated: DnD5eStats = { ...stats };

    updated.ac = calculateAc(updated);

    return { stats: updated, hpGained, asiAvailable };
  }

  calculateDamageRoll(attackModifier: number, targetAc: number): DamageResult {
    const attackDie = roll(20);
    const attackTotal = attackDie + attackModifier;

    const critical = attackDie === 20;
    const hit = attackDie === 20 || (attackDie !== 1 && attackTotal >= targetAc);

    let damageRolls: number[] = [];
    let damageTotal = 0;

    if (hit) {
      if (critical) {
        damageRolls = [...rollMultiple(2, 6)];
      } else {
        damageRolls = [...rollMultiple(1, 6)];
      }
      damageTotal = damageRolls.reduce((sum, r) => sum + r, 0) + attackModifier;
      if (damageTotal < 1) damageTotal = 1;
    }

    return {
      attackRoll: attackDie,
      attackTotal,
      hit,
      critical,
      damageRolls,
      damageTotal,
    };
  }

  calculateSkillCheck(
    abilityScore: number,
    difficulty: number,
    proficient = false,
    level = 1,
  ): SkillCheckResult {
    const die = roll(20);
    const abMod = abilityModifier(abilityScore);
    const prof = proficient ? proficiencyBonus(level) : 0;
    const total = die + abMod + prof;

    return {
      roll: die,
      total,
      modifier: abMod + prof,
      difficulty,
      success: die !== 1 && (die === 20 || total >= difficulty),
      criticalSuccess: die === 20,
      criticalFailure: die === 1,
    };
  }

  calculateSavingThrow(
    abilityScore: number,
    dc: number,
    proficient = false,
    level = 1,
  ): SavingThrowResult {
    const die = roll(20);
    const abMod = abilityModifier(abilityScore);
    const prof = proficient ? proficiencyBonus(level) : 0;
    const total = die + abMod + prof;

    return {
      roll: die,
      total,
      modifier: abMod + prof,
      dc,
      success: die !== 1 && (die === 20 || total >= dc),
      criticalSuccess: die === 20,
      criticalFailure: die === 1,
    };
  }

  private parseHitDieFaces(hitDice: string): number {
    const match = hitDice.match(/^(\d+)d(\d+)$/);
    if (!match || !match[2]) return 8;
    return parseInt(match[2], 10);
  }
}
