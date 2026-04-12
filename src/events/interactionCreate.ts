import { Events, type ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import type { Command } from '../types/command.js';

export const event = {
  name: Events.InteractionCreate as const,
  async execute(
    interaction: ChatInputCommandInteraction,
    commands: Map<string, Command>,
  ): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) {
      await interaction.reply({
        content: 'Unknown command.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);
      const content =
        error instanceof Error ? error.message : 'An error occurred while executing this command.';
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({
          content,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
