import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { CampaignService } from '../../services/campaign.js';
import { CampaignRepository } from '../../db/repositories/campaign.js';
import { CampaignState } from '../../services/campaign/state.js';
import { renderCampaignStatus } from '../../embeds/renderers/campaign.js';
import { prisma } from '../../db/prisma.js';

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

  async execute(interaction) {
    await interaction.deferReply();

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

    const repo = new CampaignRepository(prisma);
    const state = new CampaignState();
    const campaignService = new CampaignService(repo, state);

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
  },
} satisfies Command;
