import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { renderNarrativeResponse } from '../../embeds/renderers/story.js';

export interface ExploreCommandServices {
  generateStory?(
    campaignId: string,
    playerAction: string,
  ): Promise<{
    narrative: string;
    diceRolls: string[];
    stateChanges: string[];
  }>;
}

export default {
  data: new SlashCommandBuilder()
    .setName('explore')
    .setDescription('Explore the world and interact with the story')
    .addStringOption((option) =>
      option.setName('action').setDescription('What you want to do').setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('campaign-id')
        .setDescription('Campaign ID (leave empty to use your active campaign)'),
    ),

  async execute(interaction, services?: ExploreCommandServices) {
    await interaction.deferReply();

    const campaignId = interaction.options.getString('campaign-id');
    const action = interaction.options.getString('action', true);

    if (!campaignId) {
      await interaction.editReply({
        content: '❌ No campaign specified. Use `/campaign status` to find your campaign ID.',
      });
      return;
    }

    if (!services?.generateStory) {
      await interaction.editReply({
        content: '❌ Story service not available. Please try again later.',
      });
      return;
    }

    try {
      const result = await services.generateStory(campaignId, action);
      const embeds = renderNarrativeResponse(result.narrative);
      await interaction.editReply({ embeds });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate story';
      await interaction.editReply({ content: `❌ ${message}` });
    }
  },
} satisfies Command;
