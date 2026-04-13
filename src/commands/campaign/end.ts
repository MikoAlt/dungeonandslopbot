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
        .setName('end')
        .setDescription('End a campaign (DM only)')
        .addStringOption((option) =>
          option.setName('campaign-id').setDescription('Campaign ID').setRequired(true),
        )
        .addBooleanOption((option) =>
          option.setName('confirm').setDescription('Confirm ending the campaign').setRequired(true),
        ),
    ),

  async execute(interaction, services?: AppContainer) {
    await interaction.deferReply();

    if (!services?.campaignService) {
      await interaction.editReply({
        content: 'Services not available. Please try again later.',
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== 'end') {
      await interaction.editReply({ content: 'Invalid subcommand' });
      return;
    }

    const campaignId = interaction.options.getString('campaign-id', true);
    const confirm = interaction.options.getBoolean('confirm', true);
    const userId = interaction.user.id;

    const campaignService = services.campaignService;

    try {
      const campaign = await campaignService.getCampaign(campaignId);

      if (!confirm) {
        await interaction.editReply({
          content: `Are you sure you want to end "${campaign.name}"? This action cannot be undone. Set the confirm option to true to confirm.`,
        });
        return;
      }

      await campaignService.endCampaign(campaignId, userId);

      await interaction.editReply({
        content: `Campaign "${campaign.name}" has been ended.`,
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
