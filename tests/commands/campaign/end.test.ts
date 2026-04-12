import { describe, it, expect, vi, beforeEach } from 'bun:test';
import type { ChatInputCommandInteraction } from 'discord.js';

const mockGetCampaign = vi.fn();
const mockEndCampaign = vi.fn();

vi.mock('../../../src/db/prisma', () => ({
  prisma: {},
}));

vi.mock('../../../src/services/campaign', () => ({
  CampaignService: vi.fn().mockImplementation(() => ({
    createCampaign: vi.fn(),
    getCampaign: mockGetCampaign,
    joinCampaign: vi.fn(),
    leaveCampaign: vi.fn(),
    endCampaign: mockEndCampaign,
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

import campaignEndCommand from '../../../src/commands/campaign/end';

describe('campaign end command', () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetCampaign.mockResolvedValue({
      id: 'campaign-123',
      name: 'Test Campaign',
      dmUserId: 'dm-123',
    });

    mockEndCampaign.mockResolvedValue({
      id: 'campaign-123',
      name: 'Test Campaign',
      isActive: false,
    });

    mockInteraction = {
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
      options: {
        getSubcommand: vi.fn().mockReturnValue('end'),
        getString: vi.fn((name: string) => {
          if (name === 'campaign-id') return 'campaign-123';
          return null;
        }),
        getBoolean: vi.fn((name: string) => {
          if (name === 'confirm') return true;
          return null;
        }),
      },
      user: { id: 'dm-123' },
    };
  });

  it('defers reply with public response', async () => {
    const command = campaignEndCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalledWith();
  });

  it('ends campaign when confirm is true and user is DM', async () => {
    const command = campaignEndCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockEndCampaign).toHaveBeenCalledWith('campaign-123');
  });

  it('edits reply with success message', async () => {
    const command = campaignEndCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      content: 'Campaign "Test Campaign" has been ended.',
    });
  });

  it('rejects ending campaign when user is not DM', async () => {
    mockInteraction.user = { id: 'not-dm' } as any;

    const command = campaignEndCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      content: 'Only the DM can end this campaign.',
    });
    expect(mockEndCampaign).not.toHaveBeenCalled();
  });

  it('prompts confirmation when confirm is false', async () => {
    mockInteraction.options.getBoolean = vi.fn((name: string) => {
      if (name === 'confirm') return false;
      return null;
    });

    const command = campaignEndCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Are you sure'),
      }),
    );
    expect(mockEndCampaign).not.toHaveBeenCalled();
  });
});
