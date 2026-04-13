import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import type { AppContainer } from '../../wiring.js';
import { NotFoundError, ValidationError } from '../../errors.js';
import { Logger } from '../../utils/logger.js';

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

  async execute(interaction, services?: AppContainer) {
    await interaction.deferReply({ ephemeral: true });

    if (!services?.campaignService) {
      await interaction.editReply({
        content: 'Services not available. Please try again later.',
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== 'join') {
      await interaction.editReply({ content: 'Invalid subcommand' });
      return;
    }

    const campaignId = interaction.options.getString('campaign-id', true);
    const userId = interaction.user.id;

    const campaignService = services.campaignService;

    try {
      const campaign = await campaignService.joinCampaign(campaignId, userId);

      await interaction.editReply({
        content: `You have joined "${campaign.name}"!`,
      });
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
