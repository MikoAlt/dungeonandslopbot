import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import type { AppContainer } from '../../wiring.js';
import {
  renderCampaignStatus,
  renderWorldState,
  renderPlayerList,
} from '../../embeds/renderers/campaign.js';
import { NotFoundError, ValidationError } from '../../errors.js';
import { Logger } from '../../utils/logger.js';

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

  async execute(interaction, services?: AppContainer) {
    await interaction.deferReply();

    if (!services?.campaignService || !services?.campaignRepo) {
      await interaction.editReply({
        content: 'Services not available. Please try again later.',
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== 'status') {
      await interaction.editReply({ content: 'Invalid subcommand' });
      return;
    }

    const campaignIdInput = interaction.options.getString('campaign-id');

    const campaignService = services.campaignService;
    const campaignRepo = services.campaignRepo;

    try {
      let campaign;
      if (campaignIdInput) {
        campaign = await campaignService.getCampaign(campaignIdInput);
      } else {
        // Find active campaign in channel
        campaign = await campaignRepo.findActiveByChannelId(interaction.channelId);
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
    } catch (error) {
      if (error instanceof NotFoundError) {
        await interaction.editReply({ content: `Not found: ${error.message}` });
      } else if (error instanceof ValidationError) {
        await interaction.editReply({ content: error.message });
      } else {
        Logger.error('CampaignCommand', `Unexpected error in ${subcommand}`, error);
        await interaction.editReply({
          content: 'An unexpected error occurred. Please try again later.',
        });
      }
    }
  },
} satisfies Command;
