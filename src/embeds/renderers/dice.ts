import { EmbedBuilder } from 'discord.js';
import { Colors } from '../themes.js';
import type { DiceResult } from '../../services/rpg/dice.js';

export function renderDiceRoll(notation: string, result: DiceResult): EmbedBuilder {
  const rollsStr = result.rolls.join(', ');
  const modStr =
    result.modifier !== 0 ? ` ${result.modifier > 0 ? '+' : ''}${result.modifier}` : '';

  const embed = new EmbedBuilder()
    .setTitle(`🎲 ${notation}`)
    .setColor(Colors.RPG)
    .addFields(
      { name: 'Rolls', value: `[${rollsStr}]`, inline: false },
      { name: 'Total', value: `${result.total}`, inline: true },
    );

  if (result.modifier !== 0) {
    embed.addFields({
      name: 'Modifier',
      value: `${result.modifier > 0 ? '+' : ''}${result.modifier}`,
      inline: true,
    });
  }

  return embed;
}
