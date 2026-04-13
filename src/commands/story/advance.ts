import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { renderNarrativeResponse } from '../../embeds/renderers/story.js';
import { renderDiceRoll } from '../../embeds/renderers/dice.js';
import { Colors } from '../../embeds/themes.js';
import type { AppContainer } from '../../wiring.js';

const storyAdvanceCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('story-advance')
    .setDescription('Advance the story with a player action')
    .addStringOption((option) =>
      option.setName('action').setDescription('The action the player takes').setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('campaign-id')
        .setDescription('Campaign ID (optional - uses channel campaign if omitted)')
        .setRequired(false),
    ),

  async execute(interaction, services?: AppContainer) {
    await interaction.deferReply();

    if (!services) {
      await interaction.editReply({
        content: 'Services not available. Please try again later.',
      });
      return;
    }

    const { campaignRepo, storyService, llmOrchestrator } = services;

    const campaignIdInput = interaction.options.getString('campaign-id');
    const action = interaction.options.getString('action', true);

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

    const campaign = await campaignRepo.findById(campaignId);
    if (!campaign) {
      await interaction.editReply({ content: 'Campaign not found.' });
      return;
    }

    await storyService.advanceScene(campaignId, {
      description: action,
      playerActions: [action],
    });

    const result = await llmOrchestrator.generateStory(campaignId, action);

    const embeds = renderNarrativeResponse(result.narrative);

    if (result.diceRolls.length > 0) {
      for (const roll of result.diceRolls) {
        embeds.push(renderDiceRoll(roll.notation, roll.result));
      }
    }

    if (result.stateChanges.length > 0) {
      const stateChangeDescriptions = result.stateChanges
        .map((sc) => `${sc.key}: ${sc.oldValue} -> ${sc.newValue}`)
        .join('\n');
      const changeEmbed = new EmbedBuilder()
        .setTitle('State Changes')
        .setColor(Colors.WARNING)
        .setDescription(stateChangeDescriptions);
      embeds.push(changeEmbed);
    }

    await interaction.editReply({ embeds });
  },
};

export default storyAdvanceCommand;
