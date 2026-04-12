import type { DnD5eStats, CustomSimpleStats } from '../../types/character.js';
import type { DiceResult } from './dice.js';

export type RpgSystem = 'dnd5e' | 'custom';

export interface DamageResult {
  attackRoll: number;
  attackTotal: number;
  hit: boolean;
  critical: boolean;
  damageRolls: number[];
  damageTotal: number;
}

export interface SkillCheckResult {
  roll: number;
  total: number;
  modifier: number;
  difficulty: number;
  success: boolean;
  criticalSuccess: boolean;
  criticalFailure: boolean;
}

export interface SavingThrowResult {
  roll: number;
  total: number;
  modifier: number;
  dc: number;
  success: boolean;
  criticalSuccess: boolean;
  criticalFailure: boolean;
}

export interface LevelUpResult {
  stats: DnD5eStats | CustomSimpleStats;
  hpGained: number;
  asiAvailable: boolean;
}

export interface RPGEngine<TStats = DnD5eStats | CustomSimpleStats> {
  createDefaultStats(): TStats;
  validateStats(stats: TStats): { valid: boolean; errors: string[] };
  applyLevelUp(stats: TStats, level: number): LevelUpResult;
  calculateDamageRoll(attack: number, defense: number): DamageResult;
  calculateSkillCheck(stat: number, difficulty: number, proficient?: boolean): SkillCheckResult;
}

export function getEngine(system: 'dnd5e'): RPGEngine<DnD5eStats>;
export function getEngine(system: 'custom'): RPGEngine<CustomSimpleStats>;
export function getEngine(system: RpgSystem): RPGEngine;
export function getEngine(system: RpgSystem): RPGEngine {
  switch (system) {
    case 'dnd5e':
      return new DnD5eEngine();
    case 'custom':
      return new CustomEngine();
  }
}

import { DnD5eEngine } from './dnd5e.js';
import { CustomEngine } from './custom.js';
