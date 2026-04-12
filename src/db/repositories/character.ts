import { PrismaClient } from '../../generated/prisma/client.js';
import { BaseRepository } from './base.js';

type CharacterModel = {
  id: string;
  userId: string;
  name: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  rpgSystem: string;
  stats: unknown;
  inventory: unknown;
  backstory: string | null;
  campaignId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class CharacterRepository extends BaseRepository<CharacterModel> {
  constructor(prisma: PrismaClient) {
    super(prisma, {
      findUnique: (id) => prisma.character.findUnique({ where: { id } }),
      findMany: (args) =>
        prisma.character.findMany({
          where: args?.where,
          skip: args?.skip,
          take: args?.take,
          orderBy: args?.orderBy,
        }),
      create: (data) => prisma.character.create({ data }),
      update: (id, data) => prisma.character.update({ where: { id }, data }),
      delete: (id) => prisma.character.delete({ where: { id } }),
      count: (where) => prisma.character.count({ where }),
    });
  }

  async findByUserId(userId: string): Promise<CharacterModel[]> {
    return this.prisma.character.findMany({ where: { userId } });
  }

  async findByCampaignId(campaignId: string): Promise<CharacterModel[]> {
    return this.prisma.character.findMany({ where: { campaignId } });
  }

  async updateStats(id: string, stats: unknown): Promise<CharacterModel> {
    return this.prisma.character.update({ where: { id }, data: { stats } });
  }

  async updateInventory(id: string, inventory: unknown): Promise<CharacterModel> {
    return this.prisma.character.update({
      where: { id },
      data: { inventory },
    });
  }

  async updateHp(id: string, hp: number, maxHp?: number): Promise<CharacterModel> {
    const data: Record<string, unknown> = { hp };
    if (maxHp !== undefined) {
      data.maxHp = maxHp;
    }
    return this.prisma.character.update({ where: { id }, data });
  }

  async levelUp(id: string, newLevel: number, statChanges: unknown): Promise<CharacterModel> {
    return this.prisma.character.update({
      where: { id },
      data: { level: newLevel, stats: statChanges },
    });
  }
}
