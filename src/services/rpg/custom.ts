import type { CustomSimpleStats } from '../../types/character.js';
import { roll } from './dice.js';
import type { DamageResult, SkillCheckResult, LevelUpResult, RPGEngine } from './engine.js';

export type LevelUpChoice = 'hp' | 'attack' | 'defense';

export class CustomEngine implements RPGEngine<CustomSimpleStats> {
  createDefaultStats(): CustomSimpleStats {
    return {
      hp: 100,
      attack: 10,
      defense: 10,
      speed: 5,
      special: [],
    };
  }

  validateStats(stats: CustomSimpleStats): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Number.isInteger(stats.hp) || stats.hp < 0) {
      errors.push(`hp must be a non-negative integer, got ${stats.hp}`);
    }
    if (!Number.isInteger(stats.attack) || stats.attack < 0) {
      errors.push(`attack must be a non-negative integer, got ${stats.attack}`);
    }
    if (!Number.isInteger(stats.defense) || stats.defense < 0) {
      errors.push(`defense must be a non-negative integer, got ${stats.defense}`);
    }
    if (!Number.isInteger(stats.speed) || stats.speed < 0) {
      errors.push(`speed must be a non-negative integer, got ${stats.speed}`);
    }
    if (stats.hp > 9999) {
      errors.push(`hp exceeds reasonable maximum of 9999, got ${stats.hp}`);
    }
    if (stats.attack > 999) {
      errors.push(`attack exceeds reasonable maximum of 999, got ${stats.attack}`);
    }
    if (stats.defense > 999) {
      errors.push(`defense exceeds reasonable maximum of 999, got ${stats.defense}`);
    }

    return { valid: errors.length === 0, errors };
  }

  applyLevelUp(
    stats: CustomSimpleStats,
    _level: number,
    choice: LevelUpChoice = 'hp',
  ): LevelUpResult {
    const updated: CustomSimpleStats = { ...stats };
    let hpGained = 0;

    switch (choice) {
      case 'hp':
        hpGained = roll(10) + 5;
        updated.hp += hpGained;
        break;
      case 'attack':
        updated.attack += 2;
        break;
      case 'defense':
        updated.defense += 2;
        break;
    }

    return { stats: updated, hpGained, asiAvailable: false };
  }

  calculateDamageRoll(attack: number, defense: number): DamageResult {
    const attackRoll = roll(20);
    const attackTotal = attackRoll + attack;

    const critical = attackRoll === 20;
    const hit = attackRoll !== 1 && (critical || attackTotal > defense);

    let damageRolls: number[] = [];
    let damageTotal = 0;

    if (hit) {
      const baseDamage = Math.max(1, attack - Math.floor(defense / 2));
      const variance = roll(4) - 2;
      damageRolls = [baseDamage, variance];
      damageTotal = Math.max(1, baseDamage + variance);

      if (critical) {
        const critDamage = roll(6);
        damageRolls.push(critDamage);
        damageTotal += critDamage;
      }
    }

    return {
      attackRoll,
      attackTotal,
      hit,
      critical,
      damageRolls,
      damageTotal,
    };
  }

  calculateSkillCheck(stat: number, difficulty: number): SkillCheckResult {
    const die = roll(20);
    const total = die + stat;

    return {
      roll: die,
      total,
      modifier: stat,
      difficulty,
      success: die !== 1 && (die === 20 || total >= difficulty),
      criticalSuccess: die === 20,
      criticalFailure: die === 1,
    };
  }
}
