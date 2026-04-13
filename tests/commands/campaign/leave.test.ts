import { describe, it, expect, vi, beforeEach } from 'bun:test';
import type { ChatInputCommandInteraction } from 'discord.js';

const mockLeaveCampaign = vi.fn();

import campaignLeaveCommand from '../../../src/commands/campaign/leave';

describe('campaign leave command', () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;
  let mockServices: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLeaveCampaign.mockResolvedValue({
      id: 'campaign-123',
      name: 'Test Campaign',
      players: [],
    });

    mockServices = {
      campaignService: {
        leaveCampaign: mockLeaveCampaign,
      },
    };

    mockInteraction = {
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
      options: {
        getSubcommand: vi.fn().mockReturnValue('leave'),
        getString: vi.fn((name: string) => {
          if (name === 'campaign-id') return 'campaign-123';
          return null;
        }),
      },
      user: { id: 'user-123' },
    };
  });

  it('defers reply with ephemeral response', async () => {
    const command = campaignLeaveCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.deferReply).toHaveBeenCalledWith({ ephemeral: true });
  });

  it('leaves campaign with correct args', async () => {
    const command = campaignLeaveCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockLeaveCampaign).toHaveBeenCalledWith('campaign-123', 'user-123');
  });

  it('edits reply with success message', async () => {
    const command = campaignLeaveCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      content: 'You have left "Test Campaign".',
    });
  });
});
