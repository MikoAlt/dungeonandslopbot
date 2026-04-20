import { PrismaClient } from '../../generated/prisma/client.js';
import { BaseRepository } from './base.js';

type UserModel = {
  id: string;
  discordId: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
};

export class UserRepository extends BaseRepository<UserModel> {
  constructor(prisma: PrismaClient) {
    super(prisma, {
      findUnique: (id) => prisma.user.findUnique({ where: { id } }),
      findMany: (args) =>
        prisma.user.findMany({
          where: args?.where,
          skip: args?.skip,
          take: args?.take,
          orderBy: args?.orderBy,
        }),
      create: (data) => prisma.user.create({ data }),
      update: (id, data) => prisma.user.update({ where: { id }, data }),
      delete: (id) => prisma.user.delete({ where: { id } }),
      count: (where) => prisma.user.count({ where }),
    });
  }

  async findByDiscordId(discordId: string): Promise<UserModel | null> {
    return this.prisma.user.findUnique({ where: { discordId } });
  }

  async upsertByDiscordId(discordId: string, username: string): Promise<UserModel> {
    return this.prisma.user.upsert({
      where: { discordId },
      update: { username },
      create: { discordId, username },
    });
  }
}
