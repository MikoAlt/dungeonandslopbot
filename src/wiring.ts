import { PrismaClient } from './generated/prisma/client.js';
import { prisma } from './db/prisma.js';
import { CharacterRepository } from './db/repositories/character.js';
import { CampaignRepository } from './db/repositories/campaign.js';
import { StoryRepository } from './db/repositories/story.js';
import { MessageRepository } from './db/repositories/message.js';
import { EmbeddingRepository } from './db/repositories/embedding.js';
import { CharacterService } from './services/character.js';
import { CampaignService } from './services/campaign.js';
import { StoryService } from './services/story.js';
import { LLMOrchestrator, createOrchestrator } from './services/llm/orchestrator.js';
import { ContextManager } from './services/context/manager.js';
import { CommandQueue } from './services/queue.js';
import { RateLimiter } from './services/rate-limiter.js';
import { MultiplayerHandlerFactory } from './services/multiplayer/factory.js';
import { CampaignState } from './services/campaign/state.js';
import type { ChatMessage, Campaign } from './types/index.js';

export interface AppContainer {
  prisma: PrismaClient;
  campaignRepo: CampaignRepository;
  storyRepo: StoryRepository;
  characterRepo: CharacterRepository;
  messageRepo: MessageRepository;
  embeddingRepo: EmbeddingRepository;
  campaignService: CampaignService;
  storyService: StoryService;
  characterService: CharacterService;
  llmOrchestrator: LLMOrchestrator;
  contextManager: ContextManager;
  commandQueue: CommandQueue;
  rateLimiter: RateLimiter;
  multiplayerFactory: MultiplayerHandlerFactory;
}

interface MessageStoreData {
  messages: Map<string, ChatMessage[]>;
  campaigns: Map<string, Campaign>;
}

function createMessageStore(): {
  store: MessageStoreData;
  messageRepo: MessageRepository;
  campaignRepo: CampaignRepository;
} {
  const messageRepo = new MessageRepository(prisma);
  const campaignRepo = new CampaignRepository(prisma);

  const store: MessageStoreData = {
    messages: new Map(),
    campaigns: new Map(),
  };

  return { store, messageRepo, campaignRepo };
}

export async function createContainer(): Promise<AppContainer> {
  const campaignRepo = new CampaignRepository(prisma);
  const storyRepo = new StoryRepository(prisma);
  const characterRepo = new CharacterRepository(prisma);
  const messageRepo = new MessageRepository(prisma);
  const embeddingRepo = new EmbeddingRepository(prisma);

  const campaignState = new CampaignState();

  const campaignService = new CampaignService(campaignRepo, campaignState);
  const storyService = new StoryService(storyRepo);
  const characterService = new CharacterService(characterRepo);

  const messageStoreData = createMessageStore();

  const contextManager = new ContextManager({
    getMessages(campaignId: string): ChatMessage[] {
      return messageStoreData.store.messages.get(campaignId) ?? [];
    },
    addMessage(campaignId: string, role: ChatMessage['role'], content: string): ChatMessage {
      const messages = messageStoreData.store.messages.get(campaignId) ?? [];
      const newMessage: ChatMessage = {
        role,
        content,
        timestamp: new Date(),
      };
      messages.push(newMessage);
      messageStoreData.store.messages.set(campaignId, messages);

      messageRepo.createMessage(campaignId, null, role, content, 0).catch(() => {});

      return newMessage;
    },
    getCampaign(campaignId: string): Campaign | undefined {
      return messageStoreData.store.campaigns.get(campaignId);
    },
    async updateWorldState(campaignId: string, worldState: Campaign['worldState']): Promise<void> {
      const campaign = messageStoreData.store.campaigns.get(campaignId);
      if (campaign) {
        const updated: Campaign = {
          ...campaign,
          worldState,
        };
        messageStoreData.store.campaigns.set(campaignId, updated);
        await campaignRepo.updateWorldState(campaignId, worldState);
      }
    },
  });

  const llmConfig = {
    modelName: process.env.LLM_MODEL_NAME ?? 'gpt-4',
    temperature: 0.7,
    maxTokens: 4000,
    apiKey: process.env.LLM_API_KEY,
    baseUrl: process.env.LLM_API_URL,
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
    openRouterModel: 'openai/gpt-4',
  };

  const llmOrchestrator = createOrchestrator(contextManager, llmConfig);

  const commandQueue = new CommandQueue();
  const rateLimiter = new RateLimiter();
  const multiplayerFactory = new MultiplayerHandlerFactory();

  return {
    prisma,
    campaignRepo,
    storyRepo,
    characterRepo,
    messageRepo,
    embeddingRepo,
    campaignService,
    storyService,
    characterService,
    llmOrchestrator,
    contextManager,
    commandQueue,
    rateLimiter,
    multiplayerFactory,
  };
}

export async function shutdownContainer(container: AppContainer): Promise<void> {
  await container.prisma.$disconnect();
}
