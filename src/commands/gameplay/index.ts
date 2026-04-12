import diceCommand from './dice.js';
import exploreCommand from './explore.js';
import combatCommand from './combat.js';
import skillCheckCommand from './skill-check.js';
import inventoryCommand from './inventory.js';

export const gameplayCommands = [
  diceCommand,
  exploreCommand,
  combatCommand,
  skillCheckCommand,
  inventoryCommand,
];

export { diceCommand, exploreCommand, combatCommand, skillCheckCommand, inventoryCommand };
