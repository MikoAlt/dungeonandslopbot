import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { StoryService } from '../../services/story.js';
import { StoryRepository } from '../../db/repositories/story.js';
import { CampaignRepository } from '../../db/repositories/campaign.js';
import { MessageRepository } from '../../db/repositories/message.js';
import { LLMOrchestrator } from '../../services/llm/orchestrator.js';
import type { OrchestratorConfig } from '../../services/llm/orchestrator.js';
import { ContextManager } from '../../services/context/manager.js';
import { renderNarrativeResponse } from '../../embeds/renderers/story.js';
import { renderDiceRoll } from '../../embeds/renderers/dice.js';
import { prisma } from '../../db/prisma.js';
import { loadConfig } from '../../config/index.js';
import { createLLM } from '../../services/llm/client.js';
import { Colors } from '../../embeds/themes.js';
import { EmbedBuilder } from 'discord.js';
import type { ChatMessage, Campaign } from '../../types/index.js';
import type { MessageStore } from '../../services/context/manager.js';

function createMessageStore(
  campaignRepo: CampaignRepository,
  messageRepo: MessageRepository,
): MessageStore {
  return {
    async getMessages(campaignId: string): Promise<ChatMessage[]> {
      const messages = await messageRepo.findByCampaignId(campaignId);
      return messages.map((m) => ({
        role: m.role as ChatMessage['role'],
        content: m.content,
        timestamp: m.createdAt,
      }));
    },
    async addMessage(
      campaignId: string,
      role: ChatMessage['role'],
      content: string,
    ): Promise<ChatMessage> {
      const msg = await messageRepo.createMessage(campaignId, null, role, content, content.length);
      return {
        role: msg.role as ChatMessage['role'],
        content: msg.content,
        timestamp: msg.createdAt,
      };
    },
    async getCampaign(campaignId: string): Promise<Campaign | undefined> {
      return (await campaignRepo.findById(campaignId)) as Campaign | undefined;
    },
    async updateWorldState(campaignId: string, worldState: Campaign['worldState']): Promise<void> {
      await campaignRepo.updateWorldState(campaignId, worldState);
    },
  };
}

async function createOrchestratorInstance(
  campaignRepo: CampaignRepository,
  messageRepo: MessageRepository,
): Promise<LLMOrchestrator> {
  const config = loadConfig();
  const messageStore = createMessageStore(campaignRepo, messageRepo);
  const contextManager = new ContextManager(messageStore);
  const llm = createLLM({
    modelName: config.LLM_MODEL_NAME,
    apiKey: config.LLM_API_KEY,
    baseUrl: config.LLM_API_URL,
  });
  const orchestratorConfig: OrchestratorConfig = {
    modelName: config.LLM_MODEL_NAME,
    apiKey: config.LLM_API_KEY,
    baseUrl: config.LLM_API_URL,
    openRouterApiKey: config.OPENROUTER_API_KEY,
  };
  return new LLMOrchestrator(contextManager, llm, orchestratorConfig);
}

const storyAdvanceCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('story-advance')
    .setDescription('Advance the story with a player action')
    .addStringOption((option) =>
      option
        .setName('campaign-id')
        .setDescription('Campaign ID (optional - uses channel campaign if omitted)')
        .setRequired(false),
    )
    .addStringOption((option) =>
      option.setName('action').setDescription('The action the player takes').setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const campaignRepo = new CampaignRepository(prisma);
    const storyRepo = new StoryRepository(prisma);
    const messageRepo = new MessageRepository(prisma);
    const storyService = new StoryService(storyRepo);

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

    const orchestrator = await createOrchestratorInstance(campaignRepo, messageRepo);
    const result = await orchestrator.generateStory(campaignId, action);

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
