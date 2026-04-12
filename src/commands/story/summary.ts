import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { StoryService } from '../../services/story.js';
import { StoryRepository } from '../../db/repositories/story.js';
import { CampaignRepository } from '../../db/repositories/campaign.js';
import { renderStorySummary } from '../../embeds/renderers/story.js';
import { prisma } from '../../db/prisma.js';

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

  async execute(interaction) {
    await interaction.deferReply();

    const campaignRepo = new CampaignRepository(prisma);
    const storyRepo = new StoryRepository(prisma);
    const storyService = new StoryService(storyRepo);

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
