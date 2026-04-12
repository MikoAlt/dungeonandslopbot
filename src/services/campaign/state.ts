import type { Campaign } from '../../types/campaign.js';

export interface CampaignRepository {
  create(data: unknown): Promise<Campaign>;
  findById(id: string): Promise<Campaign | null>;
  findMany(args?: {
    where?: unknown;
    skip?: number;
    take?: number;
    orderBy?: unknown;
  }): Promise<Campaign[]>;
  update(id: string, data: unknown): Promise<Campaign>;
  delete(id: string): Promise<Campaign>;
  findByGuildId(guildId: string): Promise<Campaign[]>;
  findActiveByChannelId(channelId: string): Promise<Campaign | null>;
  updateWorldState(id: string, worldState: unknown): Promise<Campaign>;
  setActive(id: string, isActive: boolean): Promise<Campaign>;
  addPlayer(id: string, userId: string): Promise<Campaign>;
  removePlayer(id: string, userId: string): Promise<Campaign>;
}

export class CampaignState {
  private cache = new Map<string, Campaign>();

  async loadState(campaign: Campaign): Promise<Campaign> {
    this.cache.set(campaign.id, campaign);
    return campaign;
  }

  async saveState(campaign: Campaign): Promise<Campaign> {
    this.cache.set(campaign.id, campaign);
    return campaign;
  }

  invalidateState(campaignId: string): void {
    this.cache.delete(campaignId);
  }

  getCached(campaignId: string): Campaign | undefined {
    return this.cache.get(campaignId);
  }

  async getActiveChannel(channelId: string, repo: CampaignRepository): Promise<Campaign | null> {
    for (const campaign of this.cache.values()) {
      if (campaign.channelId === channelId && campaign.isActive) {
        return campaign;
      }
    }
    const campaign = await repo.findActiveByChannelId(channelId);
    if (campaign) {
      this.cache.set(campaign.id, campaign);
    }
    return campaign;
  }

  clear(): void {
    this.cache.clear();
  }
}
