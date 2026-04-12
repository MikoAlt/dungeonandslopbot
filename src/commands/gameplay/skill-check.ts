import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { DiceCli } from '../../services/rpg/dice-cli.js';
import { Colors } from '../../embeds/themes.js';

export default {
  data: new SlashCommandBuilder()
    .setName('skill-check')
    .setDescription('Make a skill check')
    .addStringOption((option) =>
      option
        .setName('skill')
        .setDescription('Skill name (e.g., perception, athletics)')
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName('modifier').setDescription('Additional modifier to the roll'),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const skill = interaction.options.getString('skill', true);
    const modifier = interaction.options.getInteger('modifier') ?? 0;

    const cli = new DiceCli();
    const result = cli.roll(`1d20+${modifier}`);

    const total = result.total;
    const isCriticalSuccess = result.rolls.includes(20);
    const isCriticalFailure = result.rolls.includes(1);

    let resultText: string;
    if (isCriticalSuccess) {
      resultText = '🎯 CRITICAL SUCCESS!';
    } else if (isCriticalFailure) {
      resultText = '💀 CRITICAL FAILURE!';
    } else {
      resultText = total >= 10 ? '✅ Success!' : '❌ Failure';
    }

    const rollsStr = result.rolls.join(', ');

    const embed = new EmbedBuilder()
      .setTitle(`🎲 ${skill} Check`)
      .setColor(isCriticalSuccess ? Colors.SUCCESS : isCriticalFailure ? Colors.DANGER : Colors.RPG)
      .addFields(
        { name: 'Roll', value: `[${rollsStr}]`, inline: true },
        { name: 'Modifier', value: `${modifier >= 0 ? '+' : ''}${modifier}`, inline: true },
        { name: 'Total', value: `${total}`, inline: true },
      )
      .addFields({ name: 'Result', value: resultText, inline: false });

    if (isCriticalSuccess) {
      embed.setFooter({ text: '🎯 Critical Success!' });
    } else if (isCriticalFailure) {
      embed.setFooter({ text: '💀 Critical Failure!' });
    }

    await interaction.editReply({ embeds: [embed] });
  },
} satisfies Command;
