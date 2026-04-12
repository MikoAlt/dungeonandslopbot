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
        .setName('end')
        .setDescription('End a campaign (DM only)')
        .addStringOption((option) =>
          option.setName('campaign-id').setDescription('Campaign ID').setRequired(true),
        )
        .addBooleanOption((option) =>
          option.setName('confirm').setDescription('Confirm ending the campaign').setRequired(true),
        ),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== 'end') {
      await interaction.editReply({ content: 'Invalid subcommand' });
      return;
    }

    const campaignId = interaction.options.getString('campaign-id', true);
    const confirm = interaction.options.getBoolean('confirm', true);
    const userId = interaction.user.id;

    const repo = new CampaignRepository(prisma);
    const state = new CampaignState();
    const campaignService = new CampaignService(repo, state);

    const campaign = await campaignService.getCampaign(campaignId);

    if (campaign.dmUserId !== userId) {
      await interaction.editReply({
        content: 'Only the DM can end this campaign.',
      });
      return;
    }

    if (!confirm) {
      await interaction.editReply({
        content: `Are you sure you want to end "${campaign.name}"? This action cannot be undone. Provide --confirm true to confirm.`,
      });
      return;
    }

    await campaignService.endCampaign(campaignId);

    await interaction.editReply({
      content: `Campaign "${campaign.name}" has been ended.`,
    });
  },
} satisfies Command;
