import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import type { AppContainer } from '../../wiring.js';
import { renderCampaignStatus } from '../../embeds/renderers/campaign.js';
import { NotFoundError, ValidationError } from '../../errors.js';
import { Logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('campaign')
    .setDescription('Campaign management commands')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create a new campaign')
        .addStringOption((option) =>
          option.setName('name').setDescription('Campaign name').setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('system')
            .setDescription('RPG system')
            .addChoices({ name: 'D&D 5e', value: 'dnd5e' }, { name: 'Custom', value: 'custom' })
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('mode')
            .setDescription('Campaign mode')
            .addChoices(
              { name: 'Shared Session', value: 'sharedSession' },
              { name: 'Persistent World', value: 'persistentWorld' },
              { name: 'Async', value: 'async' },
            )
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('description')
            .setDescription('Campaign description (optional)')
            .setRequired(false),
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
    if (subcommand !== 'create') {
      await interaction.editReply({ content: 'Invalid subcommand' });
      return;
    }

    const name = interaction.options.getString('name', true);
    const system = interaction.options.getString('system', true) as 'dnd5e' | 'custom';
    const mode = interaction.options.getString('mode', true) as
      | 'sharedSession'
      | 'persistentWorld'
      | 'async';
    const description = interaction.options.getString('description') ?? '';

    const userId = interaction.user.id;
    const guildId = interaction.guildId ?? '';
    const channelId = interaction.channelId;

    const campaignService = services.campaignService;

    try {
      const campaign = await campaignService.createCampaign({
        name,
        description,
        rpgSystem: system,
        mode,
        dmUserId: userId,
        guildId,
        channelId,
      });

      const embeds = renderCampaignStatus(campaign);
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
