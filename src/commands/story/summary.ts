import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import type { AppContainer } from '../../wiring.js';
import { renderStorySummary } from '../../embeds/renderers/story.js';

const storySummaryCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('story-summary')
    .setDescription('Get a summary of the campaign story')
    .addStringOption((option) =>
      option
        .setName('campaign-id')
        .setDescription('Campaign ID (optional - uses channel campaign if omitted)')
        .setRequired(false),
    ),

  async execute(interaction, services?: AppContainer) {
    await interaction.deferReply();

    if (!services?.campaignRepo || !services?.storyService) {
      await interaction.editReply({
        content: 'Services not available. Please try again later.',
      });
      return;
    }

    const { campaignRepo, storyService } = services;

    const campaignIdInput = interaction.options.getString('campaign-id');

    let campaignId = campaignIdInput;
    if (!campaignId) {
      const campaign = await campaignRepo.findActiveByChannelId(interaction.channelId);
      if (!campaign) {
        await interaction.editReply({
          content: 'No active campaign found in this channel. Provide a campaign ID.',
        });
        return;
      }
      campaignId = campaign.id;
    }

    const summary = await storyService.summarizeStory(campaignId);
    const embeds = renderStorySummary({
      id: '',
      campaignId,
      scenes: [],
      currentSceneIndex: 0,
      summary,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await interaction.editReply({ embeds });
  },
};

export default storySummaryCommand;
