import { PrismaClient } from '../../generated/prisma/client.js';
import { BaseRepository } from './base.js';

type MessageModel = {
  id: string;
  campaignId: string;
  userId: string | null;
  role: string;
  content: string;
  tokenCount: number;
  metadata: unknown;
  createdAt: Date;
};

export class MessageRepository extends BaseRepository<MessageModel> {
  constructor(prisma: PrismaClient) {
    super(prisma, {
      findUnique: (id) => prisma.message.findUnique({ where: { id } }),
      findMany: (args) =>
        prisma.message.findMany({
          where: args?.where,
          skip: args?.skip,
          take: args?.take,
          orderBy: args?.orderBy,
        }),
      create: (data) => prisma.message.create({ data }),
      update: (id, data) => prisma.message.update({ where: { id }, data }),
      delete: (id) => prisma.message.delete({ where: { id } }),
      count: (where) => prisma.message.count({ where }),
    });
  }

  async findByCampaignId(
    campaignId: string,
    limit?: number,
    offset?: number,
  ): Promise<MessageModel[]> {
    return this.prisma.message.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });
  }

  async createMessage(
    campaignId: string,
    userId: string | null,
    role: string,
    content: string,
    tokenCount: number,
  ): Promise<MessageModel> {
    return this.prisma.message.create({
      data: { campaignId, userId, role, content, tokenCount },
    });
  }

  async deleteOldMessages(campaignId: string, beforeDate: Date): Promise<number> {
    const result = await this.prisma.message.deleteMany({
      where: {
        campaignId,
        createdAt: { lt: beforeDate },
      },
    });
    return result.count;
  }
}
