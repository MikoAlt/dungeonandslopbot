import { PrismaClient } from '../../generated/prisma/client.js';
import { BaseRepository } from './base.js';
import { NotFoundError } from '../../errors.js';

type CampaignModel = {
  id: string;
  name: string;
  description: string;
  rpgSystem: string;
  mode: string;
  dmUserId: string;
  guildId: string;
  channelId: string;
  worldState: unknown;
  isActive: boolean;
  players: string[];
  createdAt: Date;
  updatedAt: Date;
};

export class CampaignRepository extends BaseRepository<CampaignModel> {
  constructor(prisma: PrismaClient) {
    super(prisma, {
      findUnique: (id) => prisma.campaign.findUnique({ where: { id } }),
      findMany: (args) =>
        prisma.campaign.findMany({
          where: args?.where,
          skip: args?.skip,
          take: args?.take,
          orderBy: args?.orderBy,
        }),
      create: (data) => prisma.campaign.create({ data }),
      update: (id, data) => prisma.campaign.update({ where: { id }, data }),
      delete: (id) => prisma.campaign.delete({ where: { id } }),
      count: (where) => prisma.campaign.count({ where }),
    });
  }

  async findByGuildId(guildId: string): Promise<CampaignModel[]> {
    return this.prisma.campaign.findMany({ where: { guildId } });
  }

  async findActiveByChannelId(channelId: string): Promise<CampaignModel | null> {
    const results = await this.prisma.campaign.findMany({
      where: { channelId, isActive: true },
      take: 1,
    });
    return results[0] ?? null;
  }

  async updateWorldState(id: string, worldState: unknown): Promise<CampaignModel> {
    return this.prisma.campaign.update({ where: { id }, data: { worldState } });
  }

  async setActive(id: string, isActive: boolean): Promise<CampaignModel> {
    return this.prisma.campaign.update({ where: { id }, data: { isActive } });
  }

  async addPlayer(id: string, userId: string): Promise<CampaignModel> {
    return this.prisma.campaign.update({
      where: { id },
      data: { players: { push: userId } },
    });
  }

  async removePlayer(id: string, userId: string): Promise<CampaignModel> {
    const campaign = await this.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign', id);
    }
    const players = (campaign.players as string[]).filter((p) => p !== userId);
    return this.prisma.campaign.update({ where: { id }, data: { players } });
  }
}
