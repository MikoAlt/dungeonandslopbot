export {
  roll,
  rollMultiple,
  rollWithModifier,
  parseDiceNotation,
  rollFromNotation,
} from './dice.js';
export type { DiceNotation, DiceResult } from './dice.js';

export { DnD5eEngine, abilityModifier, proficiencyBonus, calculateAc } from './dnd5e.js';
export { CustomEngine } from './custom.js';
export type { LevelUpChoice } from './custom.js';

export { getEngine } from './engine.js';
export type {
  RpgSystem,
  DamageResult,
  SkillCheckResult,
  SavingThrowResult,
  LevelUpResult,
  RPGEngine,
} from './engine.js';
