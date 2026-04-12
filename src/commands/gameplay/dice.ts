import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { DiceCli } from '../../services/rpg/dice-cli.js';
import { renderDiceRoll } from '../../embeds/renderers/dice.js';
import type { DiceResult } from '../../services/rpg/dice.js';

function adaptDiceCliResult(result: ReturnType<DiceCli['roll']>): DiceResult {
  return {
    rolls: result.rolls,
    total: result.total,
    modifier: result.modifier,
    notation: {
      count: result.rolls.length,
      sides: 0,
      modifier: result.modifier,
    },
  };
}

export default {
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Dice rolling commands')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('roll')
        .setDescription('Roll dice')
        .addStringOption((option) =>
          option
            .setName('notation')
            .setDescription('Dice notation (e.g., 2d6+3)')
            .setRequired(true),
        )
        .addBooleanOption((option) =>
          option.setName('advantage').setDescription('Roll with advantage'),
        )
        .addBooleanOption((option) =>
          option.setName('disadvantage').setDescription('Roll with disadvantage'),
        ),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== 'roll') {
      await interaction.editReply({ content: 'Invalid subcommand' });
      return;
    }

    const notation = interaction.options.getString('notation', true);
    const advantage = interaction.options.getBoolean('advantage') ?? false;
    const disadvantage = interaction.options.getBoolean('disadvantage') ?? false;

    let fullNotation = notation;
    if (advantage && !disadvantage) {
      fullNotation = `${notation} advantage`;
    } else if (disadvantage && !advantage) {
      fullNotation = `${notation} disadvantage`;
    }

    const cli = new DiceCli();

    try {
      const result = cli.roll(fullNotation);
      const diceResult = adaptDiceCliResult(result);
      const embeds = renderDiceRoll(notation, diceResult);

      if (result.isCrit) {
        embeds.setFooter({ text: '🎯 CRITICAL!' });
      } else if (result.isFumble) {
        embeds.setFooter({ text: '💀 FUMBLE!' });
      }

      await interaction.editReply({ embeds: [embeds] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid dice notation';
      await interaction.editReply({ content: `❌ ${message}` });
    }
  },
} satisfies Command;
