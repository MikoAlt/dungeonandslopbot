import { describe, it, expect, vi, beforeEach } from 'bun:test';
import type { ChatInputCommandInteraction } from 'discord.js';

const mockCreateCampaign = vi.fn();

vi.mock('../../../src/embeds/renderers/campaign', () => ({
  renderCampaignStatus: vi.fn().mockReturnValue([{ data: { title: 'Test Campaign' } }]),
}));

import campaignCreateCommand from '../../../src/commands/campaign/create';

describe('campaign create command', () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;
  let mockServices: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCreateCampaign.mockResolvedValue({
      id: 'campaign-123',
      name: 'Test Campaign',
      description: 'A test',
      rpgSystem: 'dnd5e',
      mode: 'sharedSession',
      dmUserId: 'user-123',
      guildId: 'guild-123',
      channelId: 'channel-123',
      worldState: {
        currentLocation: 'Start',
        npcs: [],
        quests: [],
        events: [],
        sessionCount: 0,
      },
      isActive: true,
      players: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockServices = {
      campaignService: {
        createCampaign: mockCreateCampaign,
      },
    };

    mockInteraction = {
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
      options: {
        getSubcommand: vi.fn().mockReturnValue('create'),
        getString: vi.fn((name: string) => {
          const values: Record<string, string> = {
            name: 'Test Campaign',
            system: 'dnd5e',
            mode: 'sharedSession',
            description: 'A test campaign',
          };
          return values[name];
        }),
      },
      user: { id: 'user-123' },
      guildId: 'guild-123',
      channelId: 'channel-123',
    };
  });

  it('defers reply with public response', async () => {
    const command = campaignCreateCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.deferReply).toHaveBeenCalledWith();
  });

  it('creates campaign with correct data', async () => {
    const command = campaignCreateCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockCreateCampaign).toHaveBeenCalledWith({
      name: 'Test Campaign',
      description: 'A test campaign',
      rpgSystem: 'dnd5e',
      mode: 'sharedSession',
      dmUserId: 'user-123',
      guildId: 'guild-123',
      channelId: 'channel-123',
    });
  });

  it('edits reply with campaign status embeds', async () => {
    const command = campaignCreateCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
      }),
    );
  });

  it('handles optional description being empty', async () => {
    mockInteraction.options.getString = vi.fn((name: string) => {
      if (name === 'description') return null;
      const values: Record<string, string> = {
        name: 'Test Campaign',
        system: 'dnd5e',
        mode: 'sharedSession',
      };
      return values[name];
    });

    const command = campaignCreateCommand;
    await command.execute(mockInteraction as ChatInputCommandInteraction, mockServices);

    expect(mockCreateCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        description: '',
      }),
    );
  });
});
