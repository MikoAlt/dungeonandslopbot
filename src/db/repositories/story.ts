import { PrismaClient } from '../../generated/prisma/client.js';
import { BaseRepository } from './base.js';

type StoryModel = {
  id: string;
  campaignId: string;
  scenes: unknown;
  currentSceneIndex: number;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class StoryRepository extends BaseRepository<StoryModel> {
  constructor(prisma: PrismaClient) {
    super(prisma, {
      findUnique: (id) => prisma.story.findUnique({ where: { id } }),
      findMany: (args) =>
        prisma.story.findMany({
          where: args?.where,
          skip: args?.skip,
          take: args?.take,
          orderBy: args?.orderBy,
        }),
      create: (data) => prisma.story.create({ data }),
      update: (id, data) => prisma.story.update({ where: { id }, data }),
      delete: (id) => prisma.story.delete({ where: { id } }),
      count: (where) => prisma.story.count({ where }),
    });
  }

  async findByCampaignId(campaignId: string): Promise<StoryModel | null> {
    const results = await this.prisma.story.findMany({
      where: { campaignId },
      take: 1,
    });
    return results[0] ?? null;
  }

  async addScene(campaignId: string, scene: unknown): Promise<StoryModel> {
    const story = await this.findByCampaignId(campaignId);
    if (!story) {
      throw new Error(`Story for campaign ${campaignId} not found`);
    }
    const scenes = [...(story.scenes as unknown[]), scene];
    return this.prisma.story.update({
      where: { id: story.id },
      data: { scenes },
    });
  }

  async updateSummary(campaignId: string, summary: string): Promise<StoryModel> {
    const story = await this.findByCampaignId(campaignId);
    if (!story) {
      throw new Error(`Story for campaign ${campaignId} not found`);
    }
    return this.prisma.story.update({
      where: { id: story.id },
      data: { summary },
    });
  }

  async getCurrentScene(campaignId: string): Promise<unknown | null> {
    const story = await this.findByCampaignId(campaignId);
    if (!story) {
      return null;
    }
    const scenes = story.scenes as unknown[];
    const index = story.currentSceneIndex;
    if (index < 0 || index >= scenes.length) {
      return null;
    }
    return scenes[index];
  }
}
