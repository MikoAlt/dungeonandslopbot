import { describe, it, expect, vi, beforeEach } from 'bun:test';
import type { ChatInputCommandInteraction } from 'discord.js';
import { ValidationError } from '../../../src/errors.js';

const mockGetCampaign = vi.fn();
const mockEndCampaign = vi.fn();

import campaignEndCommand from '../../../src/commands/campaign/end';

describe('campaign end command', () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;
  let mockServices: any;

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

    mockServices = {
      campaignService: {
        getCampaign: mockGetCampaign,
        endCampaign: mockEndCampaign,
      },
    };

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
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.deferReply).toHaveBeenCalledWith();
  });

  it('ends campaign when confirm is true and user is DM', async () => {
    const command = campaignEndCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockEndCampaign).toHaveBeenCalledWith('campaign-123', 'dm-123');
  });

  it('edits reply with success message', async () => {
    const command = campaignEndCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      content: 'Campaign "Test Campaign" has been ended.',
    });
  });

  it('rejects ending campaign when user is not DM', async () => {
    mockInteraction.user = { id: 'not-dm' } as any;
    mockEndCampaign.mockRejectedValue(
      new ValidationError([{ message: 'Only the DM can end this campaign' }]),
    );

    const command = campaignEndCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      content: 'Only the DM can end this campaign',
    });
    expect(mockEndCampaign).toHaveBeenCalledWith('campaign-123', 'not-dm');
  });

  it('prompts confirmation when confirm is false', async () => {
    mockInteraction.options.getBoolean = vi.fn((name: string) => {
      if (name === 'confirm') return false;
      return null;
    });

    const command = campaignEndCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Are you sure'),
      }),
    );
    expect(mockEndCampaign).not.toHaveBeenCalled();
  });
});
