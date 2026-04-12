import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { CampaignService } from '../../services/campaign.js';
import { CampaignRepository } from '../../db/repositories/campaign.js';
import { CampaignState } from '../../services/campaign/state.js';
import { prisma } from '../../db/prisma.js';

export default {
  data: new SlashCommandBuilder()
    .setName('campaign')
    .setDescription('Campaign management commands')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('join')
        .setDescription('Join a campaign')
        .addStringOption((option) =>
          option.setName('campaign-id').setDescription('Campaign ID').setRequired(true),
        ),
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== 'join') {
      await interaction.editReply({ content: 'Invalid subcommand' });
      return;
    }

    const campaignId = interaction.options.getString('campaign-id', true);
    const userId = interaction.user.id;

    const repo = new CampaignRepository(prisma);
    const state = new CampaignState();
    const campaignService = new CampaignService(repo, state);

    const campaign = await campaignService.joinCampaign(campaignId, userId);

    await interaction.editReply({
      content: `You have joined "${campaign.name}"!`,
    });
  },
} satisfies Command;
