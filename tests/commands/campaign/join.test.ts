import { describe, it, expect, vi, beforeEach } from 'bun:test';
import type { ChatInputCommandInteraction } from 'discord.js';

const mockJoinCampaign = vi.fn();

vi.mock('../../../src/db/prisma', () => ({
  prisma: {},
}));

vi.mock('../../../src/services/campaign', () => ({
  CampaignService: vi.fn().mockImplementation(() => ({
    createCampaign: vi.fn(),
    getCampaign: vi.fn(),
    joinCampaign: mockJoinCampaign,
    leaveCampaign: vi.fn(),
    endCampaign: vi.fn(),
  })),
}));

vi.mock('../../../src/db/repositories/campaign', () => ({
  CampaignRepository: vi.fn().mockImplementation(() => ({
    findActiveByChannelId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  })),
}));

vi.mock('../../../src/services/campaign/state', () => ({
  CampaignState: vi.fn().mockImplementation(() => ({})),
}));

import campaignJoinCommand from '../../../src/commands/campaign/join';

describe('campaign join command', () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockJoinCampaign.mockResolvedValue({
      id: 'campaign-123',
      name: 'Test Campaign',
      players: ['user-123'],
    });

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
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalledWith({ ephemeral: true });
  });

  it('joins campaign with correct args', async () => {
    const command = campaignJoinCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockJoinCampaign).toHaveBeenCalledWith('campaign-123', 'user-123');
  });

  it('edits reply with success message', async () => {
    const command = campaignJoinCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      content: 'You have joined "Test Campaign"!',
    });
  });
});
