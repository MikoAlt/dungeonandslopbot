import { describe, it, expect, vi, beforeEach } from 'bun:test';
import type { ChatInputCommandInteraction } from 'discord.js';

const mockSummarizeStory = vi.fn();
const mockFindActiveByChannelId = vi.fn();

vi.mock('../../../src/db/prisma', () => ({
  prisma: {},
}));

vi.mock('../../../src/services/story', () => ({
  StoryService: vi.fn().mockImplementation(() => ({
    advanceScene: vi.fn(),
    summarizeStory: mockSummarizeStory,
  })),
}));

vi.mock('../../../src/db/repositories/story', () => ({
  StoryRepository: vi.fn().mockImplementation(() => ({
    findByCampaignId: vi.fn(),
    create: vi.fn(),
    updateSummary: vi.fn(),
  })),
}));

vi.mock('../../../src/db/repositories/campaign', () => ({
  CampaignRepository: vi.fn().mockImplementation(() => ({
    findActiveByChannelId: mockFindActiveByChannelId,
    findById: vi.fn(),
  })),
}));

vi.mock('../../../src/embeds/renderers/story', () => ({
  renderStorySummary: vi.fn().mockReturnValue([{ data: { title: 'Summary' } }]),
}));

import storySummaryCommand from '../../../src/commands/story/summary';

describe('story summary command', () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSummarizeStory.mockResolvedValue('The party started at a tavern and went on an adventure.');

    mockInteraction = {
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
      options: {
        getString: vi.fn((name: string) => {
          if (name === 'campaign-id') return null;
          return null;
        }),
      },
      channelId: 'channel-123',
    };
  });

  it('defers reply with public response', async () => {
    mockFindActiveByChannelId.mockResolvedValue({ id: 'campaign-123' });

    const command = storySummaryCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalledWith();
  });

  it('summarizes story for campaign', async () => {
    mockFindActiveByChannelId.mockResolvedValue({ id: 'campaign-123' });

    const command = storySummaryCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockSummarizeStory).toHaveBeenCalledWith('campaign-123');
  });

  it('edits reply with summary embeds', async () => {
    mockFindActiveByChannelId.mockResolvedValue({ id: 'campaign-123' });

    const command = storySummaryCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
      }),
    );
  });

  it('returns error when no active campaign found', async () => {
    mockFindActiveByChannelId.mockResolvedValue(null);

    const command = storySummaryCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('No active campaign'),
      }),
    );
  });
});
