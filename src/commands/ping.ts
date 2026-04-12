import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../types/command.js';

export default {
  data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),

  async execute(interaction) {
    const embed = new EmbedBuilder().setTitle('Pong!').setColor(0x00ff00);

    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;
