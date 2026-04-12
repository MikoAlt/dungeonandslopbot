import { describe, it, expect, beforeEach } from 'bun:test';
import { CampaignService, type CreateCampaignData } from '../../src/services/campaign.js';
import { CampaignState, type CampaignRepository } from '../../src/services/campaign/state.js';
import type { Campaign, WorldState } from '../../src/types/campaign.js';
import { NotFoundError, ValidationError } from '../../src/errors.js';

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
      currentLocation: 'Starting Location',
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

  return {
    async create(data) {
      const campaign = data as Campaign;
      campaigns.set(campaign.id, campaign);
      return campaign;
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
      const updated = { ...existing, ...data, updatedAt: new Date() } as Campaign;
      campaigns.set(id, updated);
      return updated;
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
      const updated = {
        ...existing,
        worldState: worldState as WorldState,
        updatedAt: new Date(),
      } as Campaign;
      campaigns.set(id, updated);
      return updated;
    },
    async setActive(id, isActive) {
      const existing = campaigns.get(id);
      if (!existing) throw new Error('Not found');
      const updated = { ...existing, isActive, updatedAt: new Date() } as Campaign;
      campaigns.set(id, updated);
      return updated;
    },
    async addPlayer(id, userId) {
      const existing = campaigns.get(id);
      if (!existing) throw new Error('Not found');
      const updated = {
        ...existing,
        players: [...existing.players, userId],
        updatedAt: new Date(),
      } as Campaign;
      campaigns.set(id, updated);
      return updated;
    },
    async removePlayer(id, userId) {
      const existing = campaigns.get(id);
      if (!existing) throw new Error('Not found');
      const updated = {
        ...existing,
        players: existing.players.filter((p) => p !== userId),
        updatedAt: new Date(),
      } as Campaign;
      campaigns.set(id, updated);
      return updated;
    },
  };
}

describe('CampaignService', () => {
  let service: CampaignService;
  let repo: CampaignRepository;
  let state: CampaignState;

  beforeEach(() => {
    repo = createMockRepository();
    state = new CampaignState();
    service = new CampaignService(repo, state);
  });

  describe('createCampaign', () => {
    it('creates a campaign with default world state', async () => {
      const data: CreateCampaignData = {
        name: 'Dragon Hunt',
        description: 'Hunt the ancient dragon',
        rpgSystem: 'dnd5e',
        mode: 'sharedSession',
        dmUserId: 'dm-1',
        guildId: 'guild-1',
        channelId: 'channel-1',
      };

      const campaign = await service.createCampaign(data);
      expect(campaign.name).toBe('Dragon Hunt');
      expect(campaign.rpgSystem).toBe('dnd5e');
      expect(campaign.mode).toBe('sharedSession');
      expect(campaign.isActive).toBe(true);
      expect(campaign.players).toEqual([]);
      expect(campaign.worldState.currentLocation).toBe('Starting Location');
      expect(campaign.worldState.npcs).toEqual([]);
      expect(campaign.worldState.quests).toEqual([]);
      expect(campaign.worldState.events).toEqual([]);
      expect(campaign.worldState.sessionCount).toBe(0);
    });

    it('creates a campaign with custom world state', async () => {
      const data: CreateCampaignData = {
        name: 'Custom World',
        description: 'A custom world',
        rpgSystem: 'custom',
        mode: 'persistentWorld',
        dmUserId: 'dm-1',
        guildId: 'guild-1',
        channelId: 'channel-2',
        worldState: {
          currentLocation: 'Dark Forest',
          npcs: ['Gandalf'],
          quests: [{ name: 'Find the Ring', status: 'active' }],
          events: ['Arrival at the Shire'],
          sessionCount: 5,
        },
      };

      const campaign = await service.createCampaign(data);
      expect(campaign.worldState.currentLocation).toBe('Dark Forest');
      expect(campaign.worldState.npcs).toEqual(['Gandalf']);
      expect(campaign.worldState.quests).toEqual([{ name: 'Find the Ring', status: 'active' }]);
      expect(campaign.worldState.events).toEqual(['Arrival at the Shire']);
      expect(campaign.worldState.sessionCount).toBe(5);
    });

    it('creates a campaign with async mode', async () => {
      const data: CreateCampaignData = {
        name: 'Async Campaign',
        description: 'Play by post',
        rpgSystem: 'dnd5e',
        mode: 'async',
        dmUserId: 'dm-1',
        guildId: 'guild-1',
        channelId: 'channel-3',
      };

      const campaign = await service.createCampaign(data);
      expect(campaign.mode).toBe('async');
    });

    it('throws ValidationError for invalid mode', async () => {
      const data = {
        name: 'Bad Mode',
        description: 'Invalid mode',
        rpgSystem: 'dnd5e',
        mode: 'invalidMode',
        dmUserId: 'dm-1',
        guildId: 'guild-1',
        channelId: 'channel-1',
      } as unknown as CreateCampaignData;

      await expect(service.createCampaign(data)).rejects.toThrow(ValidationError);
    });

    it('caches the created campaign in state', async () => {
      const data: CreateCampaignData = {
        name: 'Cached Campaign',
        description: 'Should be cached',
        rpgSystem: 'dnd5e',
        mode: 'sharedSession',
        dmUserId: 'dm-1',
        guildId: 'guild-1',
        channelId: 'channel-1',
      };

      const campaign = await service.createCampaign(data);
      const cached = state.getCached(campaign.id);
      expect(cached).not.toBeUndefined();
      expect(cached!.name).toBe('Cached Campaign');
    });
  });

  describe('getCampaign', () => {
    it('returns campaign from cache', async () => {
      const campaign = createMockCampaign({ id: 'camp-test' });
      await state.loadState(campaign);

      const result = await service.getCampaign('camp-test');
      expect(result.id).toBe('camp-test');
    });

    it('fetches campaign from repo when not cached', async () => {
      const campaign = createMockCampaign({ id: 'camp-repo' });
      await repo.create(campaign);

      const result = await service.getCampaign('camp-repo');
      expect(result.id).toBe('camp-repo');
    });

    it('throws NotFoundError for non-existent campaign', async () => {
      await expect(service.getCampaign('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listCampaigns', () => {
    it('returns campaigns for a guild', async () => {
      await repo.create(createMockCampaign({ id: 'c1', guildId: 'guild-1' }));
      await repo.create(createMockCampaign({ id: 'c2', guildId: 'guild-1' }));
      await repo.create(createMockCampaign({ id: 'c3', guildId: 'guild-2' }));

      const campaigns = await service.listCampaigns('guild-1');
      expect(campaigns.length).toBe(2);
    });

    it('returns empty array for guild with no campaigns', async () => {
      const campaigns = await service.listCampaigns('empty-guild');
      expect(campaigns).toEqual([]);
    });
  });

  describe('joinCampaign', () => {
    it('adds a player to the campaign', async () => {
      const campaign = createMockCampaign({ id: 'camp-join' });
      await repo.create(campaign);

      const updated = await service.joinCampaign('camp-join', 'user-1');
      expect(updated.players).toContain('user-1');
    });

    it('throws ValidationError if user is already in campaign', async () => {
      const campaign = createMockCampaign({ id: 'camp-join2', players: ['user-1'] });
      await repo.create(campaign);
      await state.loadState(campaign);

      await expect(service.joinCampaign('camp-join2', 'user-1')).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError for non-existent campaign', async () => {
      await expect(service.joinCampaign('nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('leaveCampaign', () => {
    it('removes a player from the campaign', async () => {
      const campaign = createMockCampaign({ id: 'camp-leave', players: ['user-1', 'user-2'] });
      await repo.create(campaign);
      await state.loadState(campaign);

      const updated = await service.leaveCampaign('camp-leave', 'user-1');
      expect(updated.players).not.toContain('user-1');
      expect(updated.players).toContain('user-2');
    });

    it('throws ValidationError if user is not in campaign', async () => {
      const campaign = createMockCampaign({ id: 'camp-leave2', players: ['user-1'] });
      await repo.create(campaign);
      await state.loadState(campaign);

      await expect(service.leaveCampaign('camp-leave2', 'user-999')).rejects.toThrow(
        ValidationError,
      );
    });

    it('throws NotFoundError for non-existent campaign', async () => {
      await expect(service.leaveCampaign('nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateWorldState', () => {
    it('updates world state for a campaign', async () => {
      const campaign = createMockCampaign({ id: 'camp-world' });
      await repo.create(campaign);

      const newWorldState: WorldState = {
        currentLocation: 'Dragon Lair',
        npcs: ['Dragon'],
        quests: [{ name: 'Slay the Dragon', status: 'active' }],
        events: ['Dragon sighted'],
        sessionCount: 1,
      };

      const updated = await service.updateWorldState('camp-world', newWorldState);
      expect(updated.worldState.currentLocation).toBe('Dragon Lair');
      expect(updated.worldState.npcs).toEqual(['Dragon']);
    });

    it('throws ValidationError for invalid world state', async () => {
      const campaign = createMockCampaign({ id: 'camp-world2' });
      await repo.create(campaign);

      await expect(
        service.updateWorldState('camp-world2', { currentLocation: 123 } as unknown),
      ).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError for non-existent campaign', async () => {
      await expect(
        service.updateWorldState('nonexistent', { currentLocation: 'Somewhere' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('setMode', () => {
    it('sets campaign mode to persistentWorld', async () => {
      const campaign = createMockCampaign({ id: 'camp-mode' });
      await repo.create(campaign);

      const updated = await service.setMode('camp-mode', 'persistentWorld');
      expect(updated.mode).toBe('persistentWorld');
    });

    it('sets campaign mode to async', async () => {
      const campaign = createMockCampaign({ id: 'camp-mode2' });
      await repo.create(campaign);

      const updated = await service.setMode('camp-mode2', 'async');
      expect(updated.mode).toBe('async');
    });

    it('throws ValidationError for invalid mode', async () => {
      const campaign = createMockCampaign({ id: 'camp-mode3' });
      await repo.create(campaign);

      await expect(service.setMode('camp-mode3', 'invalidMode')).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError for non-existent campaign', async () => {
      await expect(service.setMode('nonexistent', 'sharedSession')).rejects.toThrow(NotFoundError);
    });
  });

  describe('endCampaign', () => {
    it('sets campaign isActive to false', async () => {
      const campaign = createMockCampaign({ id: 'camp-end' });
      await repo.create(campaign);

      const updated = await service.endCampaign('camp-end');
      expect(updated.isActive).toBe(false);
    });

    it('invalidates cache after ending campaign', async () => {
      const campaign = createMockCampaign({ id: 'camp-end2' });
      await repo.create(campaign);
      await state.loadState(campaign);

      await service.endCampaign('camp-end2');
      expect(state.getCached('camp-end2')).toBeUndefined();
    });

    it('throws NotFoundError for non-existent campaign', async () => {
      await expect(service.endCampaign('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });
});
