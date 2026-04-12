import { describe, it, expect, vi, beforeEach } from 'bun:test';
import type { ChatInputCommandInteraction } from 'discord.js';

const mockAdvanceScene = vi.fn();
const mockFindActiveByChannelId = vi.fn();
const mockFindById = vi.fn();
const mockGenerateStory = vi.fn();

vi.mock('../../../src/db/prisma', () => ({
  prisma: {},
}));

vi.mock('../../../src/services/story', () => ({
  StoryService: vi.fn().mockImplementation(() => ({
    advanceScene: mockAdvanceScene,
    summarizeStory: vi.fn(),
  })),
}));

vi.mock('../../../src/db/repositories/story', () => ({
  StoryRepository: vi.fn().mockImplementation(() => ({
    findByCampaignId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    addScene: vi.fn(),
    updateSummary: vi.fn(),
    getCurrentScene: vi.fn(),
  })),
}));

vi.mock('../../../src/db/repositories/campaign', () => ({
  CampaignRepository: vi.fn().mockImplementation(() => ({
    findActiveByChannelId: mockFindActiveByChannelId,
    findById: mockFindById,
    updateWorldState: vi.fn(),
  })),
}));

vi.mock('../../../src/db/repositories/message', () => ({
  MessageRepository: vi.fn().mockImplementation(() => ({
    findByCampaignId: vi.fn(),
    createMessage: vi.fn(),
  })),
}));

vi.mock('../../../src/services/llm/orchestrator', () => ({
  LLMOrchestrator: vi.fn().mockImplementation(() => ({
    generateStory: mockGenerateStory,
  })),
}));

vi.mock('../../../src/services/context/manager', () => ({
  ContextManager: vi.fn().mockImplementation(() => ({
    buildContext: vi.fn(),
    addMessage: vi.fn(),
  })),
}));

vi.mock('../../../src/services/llm/client', () => ({
  createLLM: vi.fn().mockReturnValue({
    invoke: vi.fn(),
  }),
}));

vi.mock('../../../src/config/index', () => ({
  loadConfig: vi.fn().mockReturnValue({
    LLM_API_URL: 'http://test',
    LLM_API_KEY: 'test-key',
    LLM_MODEL_NAME: 'gpt-4',
  }),
}));

vi.mock('../../../src/embeds/renderers/story', () => ({
  renderNarrativeResponse: vi.fn().mockReturnValue([{ data: { title: 'Narrative' } }]),
  renderStorySummary: vi.fn().mockReturnValue([{ data: { title: 'Summary' } }]),
}));

vi.mock('../../../src/embeds/renderers/dice', () => ({
  renderDiceRoll: vi.fn().mockReturnValue({ data: { title: 'Roll' } }),
}));

import storyAdvanceCommand from '../../../src/commands/story/advance';

describe('story advance command', () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAdvanceScene.mockResolvedValue({});
    mockGenerateStory.mockResolvedValue({
      narrative: 'The player attacks the goblin!',
      diceRolls: [],
      stateChanges: [],
      rawResponse: 'The player attacks the goblin!',
    });

    mockInteraction = {
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
      options: {
        getString: vi.fn((name: string) => {
          if (name === 'campaign-id') return null;
          if (name === 'action') return 'I attack the goblin';
          return null;
        }),
      },
      channelId: 'channel-123',
    };
  });

  it('defers reply with public response', async () => {
    mockFindActiveByChannelId.mockResolvedValue({ id: 'campaign-123' });
    mockFindById.mockResolvedValue({ id: 'campaign-123' });

    const command = storyAdvanceCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalledWith();
  });

  it('advances scene with player action', async () => {
    mockFindActiveByChannelId.mockResolvedValue({ id: 'campaign-123' });
    mockFindById.mockResolvedValue({ id: 'campaign-123' });

    const command = storyAdvanceCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockAdvanceScene).toHaveBeenCalledWith(
      'campaign-123',
      expect.objectContaining({
        description: 'I attack the goblin',
        playerActions: ['I attack the goblin'],
      }),
    );
  });

  it('edits reply with narrative embeds', async () => {
    mockFindActiveByChannelId.mockResolvedValue({ id: 'campaign-123' });
    mockFindById.mockResolvedValue({ id: 'campaign-123' });

    const command = storyAdvanceCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
      }),
    );
  });

  it('returns error when no active campaign found', async () => {
    mockFindActiveByChannelId.mockResolvedValue(null);

    const command = storyAdvanceCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('No active campaign'),
      }),
    );
  });
});
