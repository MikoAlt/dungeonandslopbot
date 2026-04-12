import type { Campaign, WorldState } from '../types/campaign.js';
import { CampaignSchema, WorldStateSchema } from '../types/campaign.js';
import { NotFoundError, ValidationError } from '../errors.js';
import { CampaignState, type CampaignRepository } from './campaign/state.js';

export interface CreateCampaignData {
  name: string;
  description: string;
  rpgSystem: 'dnd5e' | 'custom';
  mode: 'sharedSession' | 'persistentWorld' | 'async';
  dmUserId: string;
  guildId: string;
  channelId: string;
  worldState?: Partial<WorldState>;
}

const VALID_MODES = ['sharedSession', 'persistentWorld', 'async'] as const;

export class CampaignService {
  private state: CampaignState;

  constructor(
    private readonly repo: CampaignRepository,
    state?: CampaignState,
  ) {
    this.state = state ?? new CampaignState();
  }

  async createCampaign(data: CreateCampaignData): Promise<Campaign> {
    if (!VALID_MODES.includes(data.mode)) {
      throw new ValidationError([
        {
          message: `Invalid mode: ${data.mode}. Must be one of: ${VALID_MODES.join(', ')}`,
          path: 'mode',
        },
      ]);
    }

    const defaultWorldState: WorldState = {
      currentLocation: 'Starting Location',
      npcs: [],
      quests: [],
      events: [],
      sessionCount: 0,
    };

    const worldState: WorldState = {
      ...defaultWorldState,
      ...data.worldState,
    };

    const worldStateValidation = WorldStateSchema.safeParse(worldState);
    if (!worldStateValidation.success) {
      throw new ValidationError(
        worldStateValidation.error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path.join('.'),
        })),
      );
    }

    const campaignData = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      rpgSystem: data.rpgSystem,
      mode: data.mode,
      dmUserId: data.dmUserId,
      guildId: data.guildId,
      channelId: data.channelId,
      worldState: worldStateValidation.data,
      isActive: true,
      players: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const validation = CampaignSchema.safeParse(campaignData);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path.join('.'),
        })),
      );
    }

    const campaign = await this.repo.create(campaignData);
    await this.state.loadState(campaign);
    return campaign;
  }

  async getCampaign(id: string): Promise<Campaign> {
    const cached = this.state.getCached(id);
    if (cached) {
      return cached;
    }

    const campaign = await this.repo.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign', id);
    }
    await this.state.loadState(campaign);
    return campaign;
  }

  async listCampaigns(guildId: string): Promise<Campaign[]> {
    return this.repo.findByGuildId(guildId);
  }

  async joinCampaign(campaignId: string, userId: string): Promise<Campaign> {
    const campaign = await this.getCampaign(campaignId);
    if (campaign.players.includes(userId)) {
      throw new ValidationError([
        { message: `User ${userId} is already in campaign ${campaignId}`, path: 'userId' },
      ]);
    }

    const updated = await this.repo.addPlayer(campaignId, userId);
    await this.state.saveState(updated);
    return updated;
  }

  async leaveCampaign(campaignId: string, userId: string): Promise<Campaign> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign.players.includes(userId)) {
      throw new ValidationError([
        { message: `User ${userId} is not in campaign ${campaignId}`, path: 'userId' },
      ]);
    }

    const updated = await this.repo.removePlayer(campaignId, userId);
    await this.state.saveState(updated);
    return updated;
  }

  async updateWorldState(campaignId: string, worldState: unknown): Promise<Campaign> {
    await this.getCampaign(campaignId);

    const validation = WorldStateSchema.safeParse(worldState);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path.join('.'),
        })),
      );
    }

    const updated = await this.repo.updateWorldState(campaignId, validation.data);
    await this.state.saveState(updated);
    return updated;
  }

  async setMode(campaignId: string, mode: string): Promise<Campaign> {
    await this.getCampaign(campaignId);

    if (!VALID_MODES.includes(mode as (typeof VALID_MODES)[number])) {
      throw new ValidationError([
        {
          message: `Invalid mode: ${mode}. Must be one of: ${VALID_MODES.join(', ')}`,
          path: 'mode',
        },
      ]);
    }

    const updated = await this.repo.update(campaignId, { mode });
    await this.state.saveState(updated);
    return updated;
  }

  async endCampaign(campaignId: string): Promise<Campaign> {
    await this.getCampaign(campaignId);

    const updated = await this.repo.setActive(campaignId, false);
    this.state.invalidateState(campaignId);
    return updated;
  }
}
