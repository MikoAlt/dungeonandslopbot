import { describe, expect, test, beforeEach, vi } from 'bun:test';
import { CampaignRepository } from '../../../src/db/repositories/campaign.js';
import { PrismaClient } from '../../../src/generated/prisma/client.js';

vi.mock('../../../src/generated/prisma/client.js', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    campaign: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  })),
}));

describe('CampaignRepository', () => {
  let prisma: PrismaClient;
  let repo: CampaignRepository;

  const mockCampaign = {
    id: 'camp1',
    name: 'The Fellowship',
    description: 'Quest to destroy the One Ring',
    rpgSystem: 'dnd5e' as const,
    mode: 'sharedSession' as const,
    dmUserId: 'user1',
    guildId: 'guild1',
    channelId: 'channel1',
    worldState: {},
    isActive: true,
    players: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new PrismaClient();
    repo = new CampaignRepository(prisma);
  });

  test('findById returns campaign by id', async () => {
    (prisma.campaign.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCampaign);

    const result = await repo.findById('camp1');

    expect(result).toEqual(mockCampaign);
    expect(prisma.campaign.findUnique).toHaveBeenCalledWith({ where: { id: 'camp1' } });
  });

  test('findByGuildId returns campaigns for a guild', async () => {
    const campaigns = [mockCampaign];
    (prisma.campaign.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(campaigns);

    const result = await repo.findByGuildId('guild1');

    expect(result).toEqual(campaigns);
    expect(prisma.campaign.findMany).toHaveBeenCalledWith({ where: { guildId: 'guild1' } });
  });

  test('findActiveByChannelId returns active campaign in a channel', async () => {
    (prisma.campaign.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockCampaign]);

    const result = await repo.findActiveByChannelId('channel1');

    expect(result).toEqual(mockCampaign);
    expect(prisma.campaign.findMany).toHaveBeenCalledWith({
      where: { channelId: 'channel1', isActive: true },
      take: 1,
    });
  });

  test('findActiveByChannelId returns null when no active campaign', async () => {
    (prisma.campaign.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await repo.findActiveByChannelId('channel1');

    expect(result).toBeNull();
  });

  test('updateWorldState updates campaign world state', async () => {
    const updated = { ...mockCampaign, worldState: { currentLocation: 'Mordor' } };
    (prisma.campaign.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const result = await repo.updateWorldState('camp1', { currentLocation: 'Mordor' });

    expect(result).toEqual(updated);
    expect(prisma.campaign.update).toHaveBeenCalledWith({
      where: { id: 'camp1' },
      data: { worldState: { currentLocation: 'Mordor' } },
    });
  });

  test('setActive toggles campaign active status', async () => {
    const updated = { ...mockCampaign, isActive: false };
    (prisma.campaign.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const result = await repo.setActive('camp1', false);

    expect(result).toEqual(updated);
    expect(prisma.campaign.update).toHaveBeenCalledWith({
      where: { id: 'camp1' },
      data: { isActive: false },
    });
  });

  test('addPlayer adds a player to campaign', async () => {
    (prisma.campaign.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCampaign);
    const updated = { ...mockCampaign, players: ['user2'] };
    (prisma.campaign.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const result = await repo.addPlayer('camp1', 'user2');

    expect(result).toEqual(updated);
    expect(prisma.campaign.update).toHaveBeenCalledWith({
      where: { id: 'camp1' },
      data: { players: { push: 'user2' } },
    });
  });

  test('addPlayer throws when campaign not found', async () => {
    (prisma.campaign.update as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Record not found'),
    );

    expect(repo.addPlayer('nonexistent', 'user2')).rejects.toThrow();
  });

  test('removePlayer removes a player from campaign', async () => {
    const campaignWithPlayers = { ...mockCampaign, players: ['user2', 'user3'] };
    (prisma.campaign.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(campaignWithPlayers);
    const updated = { ...mockCampaign, players: ['user3'] };
    (prisma.campaign.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const result = await repo.removePlayer('camp1', 'user2');

    expect(result).toEqual(updated);
    expect(prisma.campaign.update).toHaveBeenCalledWith({
      where: { id: 'camp1' },
      data: { players: ['user3'] },
    });
  });

  test('removePlayer throws when campaign not found', async () => {
    (prisma.campaign.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    expect(repo.removePlayer('nonexistent', 'user2')).rejects.toThrow(
      "Campaign with id 'nonexistent' not found",
    );
  });
});
