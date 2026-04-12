import { EmbedBuilder } from 'discord.js';
import { EmbedPaginator } from '../paginator.js';
import { Colors } from '../themes.js';
import type { Character, DnD5eStats, CustomSimpleStats } from '../../types/character.js';

/**
 * Creates a text-based HP progress bar.
 * Format: `██████░░░░ 60/100` (10 blocks, filled proportional to current/max)
 */
export function createHpBar(current: number, max: number, length = 10): string {
  const clampedCurrent = Math.max(0, Math.min(current, max));
  const filled = max > 0 ? Math.round((clampedCurrent / max) * length) : 0;
  const empty = length - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `${bar} ${clampedCurrent}/${max}`;
}

/**
 * Computes the D&D 5e ability modifier from a score.
 * Formula: Math.floor((score - 10) / 2)
 */
function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Formats an ability score with its modifier.
 * Example: STR 16 (+3), DEX 8 (-1)
 */
function formatAbilityScore(name: string, score: number): string {
  const mod = abilityModifier(score);
  const sign = mod >= 0 ? '+' : '';
  return `${name} ${score} (${sign}${mod})`;
}

/**
 * Renders a full character sheet embed.
 * Uses EmbedPaginator for characters with long inventory or backstory.
 * Supports both D&D 5e and Custom Simple formats.
 */
export function renderCharacterSheet(character: Character): EmbedBuilder[] {
  const paginator = new EmbedPaginator(
    `${character.name} — Level ${character.level} ${character.class}`,
  );
  paginator.setColor(Colors.RPG);

  paginator.addField('HP', createHpBar(character.hp, character.maxHp), false);

  if (character.rpgSystem === 'dnd5e') {
    renderDnD5eSheet(paginator, character);
  } else {
    renderCustomSimpleSheet(paginator, character);
  }

  if (character.inventory.length > 0) {
    const inventoryLines = character.inventory.map(
      (item) =>
        `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}${item.description ? ` — ${item.description}` : ''}`,
    );
    paginator.addField('Inventory', inventoryLines.join('\n'), false);
  }

  if (character.backstory) {
    paginator.addDescription(character.backstory);
  }

  paginator.setFooter(`Character ID: ${character.id}`);
  return paginator.build();
}

function renderDnD5eSheet(paginator: EmbedPaginator, character: Character): void {
  const stats = character.stats as DnD5eStats;
  const abilities = [
    formatAbilityScore('STR', stats.str),
    formatAbilityScore('DEX', stats.dex),
    formatAbilityScore('CON', stats.con),
    formatAbilityScore('INT', stats.int),
    formatAbilityScore('WIS', stats.wis),
    formatAbilityScore('CHA', stats.cha),
  ];
  paginator.addField('Abilities', abilities.join('\n'), false);
  paginator.addField('AC', `${stats.ac}`, true);
  paginator.addField('Speed', `${stats.speed} ft.`, true);
  paginator.addField('Hit Dice', stats.hitDice, true);
}

function renderCustomSimpleSheet(paginator: EmbedPaginator, character: Character): void {
  const stats = character.stats as CustomSimpleStats;
  paginator.addField('HP', createHpBar(stats.hp, character.maxHp), false);
  paginator.addField('Attack', createHpBar(stats.attack, 20), true);
  paginator.addField('Defense', createHpBar(stats.defense, 20), true);
  paginator.addField('Speed', `${stats.speed}`, true);

  if (stats.special.length > 0) {
    const specialLines = stats.special.map((s) => `**${s.name}**: ${s.description}`);
    paginator.addField('Special Abilities', specialLines.join('\n'), false);
  }
}

/**
 * Renders a compact inline character summary.
 * Shows name, class, HP bar, and level in a single embed.
 */
export function renderCharacterMini(character: Character): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`${character.name}`)
    .setColor(Colors.RPG)
    .addFields(
      { name: 'Class', value: character.class, inline: true },
      { name: 'Level', value: `${character.level}`, inline: true },
      { name: 'HP', value: createHpBar(character.hp, character.maxHp), inline: false },
    );

  return embed;
}
