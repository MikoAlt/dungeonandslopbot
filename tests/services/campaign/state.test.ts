import { describe, it, expect, beforeEach } from 'bun:test';
import { CampaignState, type CampaignRepository } from '../../../src/services/campaign/state.js';
import type { Campaign } from '../../../src/types/campaign.js';

function createMockCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'camp-1',
    name: 'Test Campaign',
    description: 'A test campaign',
    rpgSystem: 'dnd5e',
    mode: 'sharedSession',
    dmUserId: 'dm-1',
    guildId: 'guild-1',
    channelId: 'channel-1',
    worldState: {
      currentLocation: 'Tavern',
      npcs: [],
      quests: [],
      events: [],
      sessionCount: 0,
    },
    isActive: true,
    players: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockRepository(): CampaignRepository {
  const campaigns = new Map<string, Campaign>();
  const campaign = createMockCampaign();
  campaigns.set(campaign.id, campaign);

  return {
    async create(data) {
      return data as Campaign;
    },
    async findById(id) {
      return campaigns.get(id) ?? null;
    },
    async findMany() {
      return Array.from(campaigns.values());
    },
    async update(id, data) {
      const existing = campaigns.get(id);
      if (!existing) throw new Error('Not found');
      return { ...existing, ...data } as Campaign;
    },
    async delete(id) {
      const c = campaigns.get(id);
      campaigns.delete(id);
      return c!;
    },
    async findByGuildId(guildId) {
      return Array.from(campaigns.values()).filter((c) => c.guildId === guildId);
    },
    async findActiveByChannelId(channelId) {
      return (
        Array.from(campaigns.values()).find((c) => c.channelId === channelId && c.isActive) ?? null
      );
    },
    async updateWorldState(id, worldState) {
      const existing = campaigns.get(id);
      if (!existing) throw new Error('Not found');
      const updated = { ...existing, worldState } as Campaign;
      campaigns.set(id, updated);
      return updated;
    },
    async setActive(id, isActive) {
      const existing = campaigns.get(id);
      if (!existing) throw new Error('Not found');
      const updated = { ...existing, isActive } as Campaign;
      campaigns.set(id, updated);
      return updated;
    },
    async addPlayer(id, userId) {
      const existing = campaigns.get(id);
      if (!existing) throw new Error('Not found');
      const updated = { ...existing, players: [...existing.players, userId] } as Campaign;
      campaigns.set(id, updated);
      return updated;
    },
    async removePlayer(id, userId) {
      const existing = campaigns.get(id);
      if (!existing) throw new Error('Not found');
      const updated = {
        ...existing,
        players: existing.players.filter((p) => p !== userId),
      } as Campaign;
      campaigns.set(id, updated);
      return updated;
    },
  };
}

describe('CampaignState', () => {
  let state: CampaignState;
  let repo: CampaignRepository;

  beforeEach(() => {
    state = new CampaignState();
    repo = createMockRepository();
  });

  describe('loadState', () => {
    it('loads a campaign into cache', async () => {
      const campaign = createMockCampaign();
      const result = await state.loadState(campaign);
      expect(result.id).toBe(campaign.id);
      expect(state.getCached(campaign.id)).toEqual(campaign);
    });

    it('overwrites existing cache entry on reload', async () => {
      const campaign = createMockCampaign();
      await state.loadState(campaign);
      const updated = { ...campaign, name: 'Updated' };
      await state.loadState(updated);
      expect(state.getCached(campaign.id)!.name).toBe('Updated');
    });
  });

  describe('saveState', () => {
    it('saves a campaign to cache', async () => {
      const campaign = createMockCampaign();
      const result = await state.saveState(campaign);
      expect(result.id).toBe(campaign.id);
      expect(state.getCached(campaign.id)).toEqual(campaign);
    });
  });

  describe('invalidateState', () => {
    it('removes a campaign from cache', async () => {
      const campaign = createMockCampaign();
      await state.loadState(campaign);
      state.invalidateState(campaign.id);
      expect(state.getCached(campaign.id)).toBeUndefined();
    });

    it('does nothing for non-existent campaign', () => {
      state.invalidateState('nonexistent');
    });
  });

  describe('getActiveChannel', () => {
    it('returns cached active campaign for channel', async () => {
      const campaign = createMockCampaign({ channelId: 'ch-1', isActive: true });
      await state.loadState(campaign);

      const result = await state.getActiveChannel('ch-1', repo);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(campaign.id);
    });

    it('returns null when no active campaign for channel in cache', async () => {
      const campaign = createMockCampaign({ channelId: 'ch-1', isActive: false });
      await state.loadState(campaign);

      const result = await state.getActiveChannel('ch-1', repo);
      expect(result).toBeNull();
    });

    it('falls back to repository when not in cache', async () => {
      const result = await state.getActiveChannel('channel-1', repo);
      expect(result).not.toBeNull();
      expect(result!.channelId).toBe('channel-1');
    });

    it('caches result from repository', async () => {
      const result = await state.getActiveChannel('channel-1', repo);
      expect(result).not.toBeNull();
      expect(state.getCached(result!.id)).toEqual(result);
    });

    it('returns null when no campaign exists for channel', async () => {
      const result = await state.getActiveChannel('nonexistent-channel', {
        ...repo,
        async findActiveByChannelId() {
          return null;
        },
      });
      expect(result).toBeNull();
    });
  });

  describe('clear', () => {
    it('clears all entries from cache', async () => {
      const c1 = createMockCampaign({ id: 'camp-1' });
      const c2 = createMockCampaign({ id: 'camp-2' });
      await state.loadState(c1);
      await state.loadState(c2);
      state.clear();
      expect(state.getCached('camp-1')).toBeUndefined();
      expect(state.getCached('camp-2')).toBeUndefined();
    });
  });
});
