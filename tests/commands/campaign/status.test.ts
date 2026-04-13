import { describe, it, expect, vi, beforeEach } from 'bun:test';
import type { ChatInputCommandInteraction } from 'discord.js';

const mockGetCampaign = vi.fn();
const mockFindActiveByChannelId = vi.fn();

vi.mock('../../../src/embeds/renderers/campaign', () => ({
  renderCampaignStatus: vi.fn().mockReturnValue([{ data: { title: 'Test Campaign' } }]),
  renderWorldState: vi.fn().mockReturnValue([{ data: { title: 'World State' } }]),
  renderPlayerList: vi.fn().mockReturnValue({ data: { title: 'Players' } }),
}));

import campaignStatusCommand from '../../../src/commands/campaign/status';

describe('campaign status command', () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;
  let mockServices: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetCampaign.mockResolvedValue({
      id: 'campaign-123',
      name: 'Test Campaign',
      description: 'A test',
      rpgSystem: 'dnd5e',
      mode: 'sharedSession',
      dmUserId: 'dm-123',
      guildId: 'guild-123',
      channelId: 'channel-123',
      worldState: {
        currentLocation: 'Tavern',
        npcs: ['NPC1'],
        quests: [],
        events: [],
        sessionCount: 1,
      },
      isActive: true,
      players: ['player-1'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockServices = {
      campaignService: {
        getCampaign: mockGetCampaign,
      },
      campaignRepo: {
        findActiveByChannelId: mockFindActiveByChannelId,
      },
    };

    mockInteraction = {
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
      options: {
        getSubcommand: vi.fn().mockReturnValue('status'),
        getString: vi.fn().mockReturnValue(null),
      },
      channelId: 'channel-123',
    };
  });

  it('defers reply with public response', async () => {
    mockFindActiveByChannelId.mockResolvedValue({
      id: 'campaign-123',
      name: 'Test Campaign',
    });

    const command = campaignStatusCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.deferReply).toHaveBeenCalledWith();
  });

  it('finds active campaign in channel when no campaign-id provided', async () => {
    mockFindActiveByChannelId.mockResolvedValue({
      id: 'campaign-123',
      name: 'Test Campaign',
    });

    const command = campaignStatusCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockFindActiveByChannelId).toHaveBeenCalledWith('channel-123');
  });

  it('uses provided campaign-id when given', async () => {
    mockInteraction.options.getString = vi.fn((name: string) => {
      if (name === 'campaign-id') return 'specific-campaign-id';
      return null;
    });

    const command = campaignStatusCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockGetCampaign).toHaveBeenCalledWith('specific-campaign-id');
    expect(mockFindActiveByChannelId).not.toHaveBeenCalled();
  });

  it('edits reply with embeds', async () => {
    mockFindActiveByChannelId.mockResolvedValue({
      id: 'campaign-123',
      name: 'Test Campaign',
    });

    const command = campaignStatusCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
      }),
    );
  });

  it('returns error message when no campaign found in channel', async () => {
    mockFindActiveByChannelId.mockResolvedValue(null);

    const command = campaignStatusCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('No active campaign found'),
      }),
    );
  });
});
