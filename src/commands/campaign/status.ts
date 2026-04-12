import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { CampaignService } from '../../services/campaign.js';
import { CampaignRepository } from '../../db/repositories/campaign.js';
import { CampaignState } from '../../services/campaign/state.js';
import {
  renderCampaignStatus,
  renderWorldState,
  renderPlayerList,
} from '../../embeds/renderers/campaign.js';
import { prisma } from '../../db/prisma.js';

export default {
  data: new SlashCommandBuilder()
    .setName('campaign')
    .setDescription('Campaign management commands')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('status')
        .setDescription('View campaign status')
        .addStringOption((option) =>
          option
            .setName('campaign-id')
            .setDescription('Campaign ID (optional - uses channel campaign if omitted)')
            .setRequired(false),
        ),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== 'status') {
      await interaction.editReply({ content: 'Invalid subcommand' });
      return;
    }

    const campaignIdInput = interaction.options.getString('campaign-id');

    const repo = new CampaignRepository(prisma);
    const state = new CampaignState();
    const campaignService = new CampaignService(repo, state);

    let campaign;
    if (campaignIdInput) {
      campaign = await campaignService.getCampaign(campaignIdInput);
    } else {
      // Find active campaign in channel
      campaign = await repo.findActiveByChannelId(interaction.channelId);
      if (!campaign) {
        await interaction.editReply({
          content:
            'No active campaign found in this channel. Provide a campaign ID to check a specific campaign.',
        });
        return;
      }
    }

    const embeds = [
      ...renderCampaignStatus(campaign),
      ...renderWorldState(campaign),
      renderPlayerList(campaign),
    ];

    await interaction.editReply({ embeds });
  },
} satisfies Command;
