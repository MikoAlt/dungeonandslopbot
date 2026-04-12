import { PrismaClient } from '../../generated/prisma/client.js';
import { BaseRepository } from './base.js';

export type CombatModel = {
  id: string;
  campaignId: string;
  participants: unknown;
  currentTurnIndex: number;
  round: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class CombatRepository extends BaseRepository<CombatModel> {
  constructor(prisma: PrismaClient) {
    super(prisma, {
      findUnique: (id) => prisma.combat.findUnique({ where: { id } }),
      findMany: (args) =>
        prisma.combat.findMany({
          where: args?.where,
          skip: args?.skip,
          take: args?.take,
          orderBy: args?.orderBy,
        }),
      create: (data) => prisma.combat.create({ data }),
      update: (id, data) => prisma.combat.update({ where: { id }, data }),
      delete: (id) => prisma.combat.delete({ where: { id } }),
      count: (where) => prisma.combat.count({ where }),
    });
  }

  async findByCampaignId(campaignId: string): Promise<CombatModel | null> {
    return this.prisma.combat.findUnique({ where: { campaignId } });
  }

  async findActiveByCampaignId(campaignId: string): Promise<CombatModel | null> {
    return this.prisma.combat.findFirst({
      where: { campaignId, isActive: true },
    });
  }

  async updateParticipants(
    id: string,
    participants: unknown,
    currentTurnIndex: number,
    round: number,
  ): Promise<CombatModel> {
    return this.prisma.combat.update({
      where: { id },
      data: { participants, currentTurnIndex, round },
    });
  }

  async deactivate(id: string): Promise<CombatModel> {
    return this.prisma.combat.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
