import { describe, it, expect, vi, beforeEach } from 'bun:test';
import { MessageFlags, type ChatInputCommandInteraction } from 'discord.js';

const mockJoinCampaign = vi.fn();

import campaignJoinCommand from '../../../src/commands/campaign/join';

describe('campaign join command', () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;
  let mockServices: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockJoinCampaign.mockResolvedValue({
      id: 'campaign-123',
      name: 'Test Campaign',
      players: ['user-123'],
    });

    mockServices = {
      campaignService: {
        joinCampaign: mockJoinCampaign,
      },
    };

    mockInteraction = {
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
      options: {
        getSubcommand: vi.fn().mockReturnValue('join'),
        getString: vi.fn((name: string) => {
          if (name === 'campaign-id') return 'campaign-123';
          return null;
        }),
      },
      user: { id: 'user-123' },
    };
  });

  it('defers reply with ephemeral response', async () => {
    const command = campaignJoinCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.deferReply).toHaveBeenCalledWith({ flags: MessageFlags.Ephemeral });
  });

  it('joins campaign with correct args', async () => {
    const command = campaignJoinCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockJoinCampaign).toHaveBeenCalledWith('campaign-123', 'user-123');
  });

  it('edits reply with success message', async () => {
    const command = campaignJoinCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      content: 'You have joined "Test Campaign"!',
    });
  });
});
