import { describe, it, expect, vi, beforeEach } from 'bun:test';
import type { ChatInputCommandInteraction } from 'discord.js';

const mockSummarizeStory = vi.fn();
const mockFindActiveByChannelId = vi.fn();

vi.mock('../../../src/embeds/renderers/story', () => ({
  renderStorySummary: vi.fn().mockReturnValue([{ data: { title: 'Summary' } }]),
}));

import storySummaryCommand from '../../../src/commands/story/summary';

describe('story summary command', () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;
  let mockServices: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSummarizeStory.mockResolvedValue('The party started at a tavern and went on an adventure.');

    mockServices = {
      campaignRepo: {
        findActiveByChannelId: mockFindActiveByChannelId,
      },
      storyService: {
        summarizeStory: mockSummarizeStory,
      },
    };

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
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.deferReply).toHaveBeenCalledWith();
  });

  it('summarizes story for campaign', async () => {
    mockFindActiveByChannelId.mockResolvedValue({ id: 'campaign-123' });

    const command = storySummaryCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockSummarizeStory).toHaveBeenCalledWith('campaign-123');
  });

  it('edits reply with summary embeds', async () => {
    mockFindActiveByChannelId.mockResolvedValue({ id: 'campaign-123' });

    const command = storySummaryCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
      }),
    );
  });

  it('returns error when no active campaign found', async () => {
    mockFindActiveByChannelId.mockResolvedValue(null);

    const command = storySummaryCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('No active campaign'),
      }),
    );
  });
});
