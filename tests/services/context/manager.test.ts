import { describe, it, expect } from 'bun:test';
import { ContextManager } from '../../../src/services/context/manager';
import type { MessageStore } from '../../../src/services/context/manager';
import type { ChatMessage, Campaign } from '../../../src/types/index';
import { RECENT_MESSAGES_BUDGET, isWithinBudget } from '../../../src/services/context/budget';

function makeCampaign(overrides?: Partial<Campaign>): Campaign {
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Test Campaign',
    description: 'A test campaign',
    rpgSystem: 'dnd5e',
    mode: 'sharedSession',
    dmUserId: 'dm123',
    guildId: 'guild456',
    channelId: 'channel789',
    worldState: {
      currentLocation: 'Phandalin',
      npcs: ['Gundren Rockseeker'],
      quests: [{ name: 'Lost Mine', status: 'active' }],
      events: [],
      sessionCount: 0,
    },
    isActive: true,
    players: ['player1'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeMessage(role: ChatMessage['role'], content: string, ts?: Date): ChatMessage {
  return { role, content, timestamp: ts ?? new Date() };
}

function createMockStore(messages: ChatMessage[] = [], campaign?: Campaign): MessageStore {
  const storedMessages = [...messages];
  const storedCampaign = campaign ?? makeCampaign();
  let worldState = { ...storedCampaign.worldState };

  return {
    getMessages: () => storedMessages,
    addMessage: (campaignId: string, role: ChatMessage['role'], content: string) => {
      const msg: ChatMessage = { role, content, timestamp: new Date() };
      storedMessages.push(msg);
      return msg;
    },
    getCampaign: (id: string) => {
      if (id === storedCampaign.id) {
        return { ...storedCampaign, worldState };
      }
      return undefined;
    },
    updateWorldState: (id: string, ws: Campaign['worldState']) => {
      worldState = ws;
    },
  };
}

describe('ContextManager', () => {
  describe('buildContext', () => {
    it('throws if campaign not found', () => {
      const store = createMockStore();
      const manager = new ContextManager(store);
      expect(() => manager.buildContext('nonexistent')).toThrow('Campaign not found');
    });

    it('assembles context window with all sections', () => {
      const campaign = makeCampaign();
      const messages = [
        makeMessage('user', 'I attack the goblin'),
        makeMessage('assistant', 'The goblin takes 5 damage'),
      ];
      const store = createMockStore(messages, campaign);
      const manager = new ContextManager(store);

      const context = manager.buildContext(campaign.id);

      expect(context.system).toBeTruthy();
      expect(context.worldState).toBeTruthy();
      expect(context.recentMessages).toHaveLength(2);
      expect(context.ragResults).toEqual([]);
      expect(context.totalTokens).toBeGreaterThan(0);
    });

    it('includes system prompt with RPG rules', () => {
      const campaign = makeCampaign();
      const store = createMockStore([], campaign);
      const manager = new ContextManager(store);

      const context = manager.buildContext(campaign.id);

      expect(context.system).toContain('RPG System');
      expect(context.system).toContain('dnd5e');
      expect(context.system).toContain('Dungeon Master');
    });

    it('includes world state in context', () => {
      const campaign = makeCampaign();
      const store = createMockStore([], campaign);
      const manager = new ContextManager(store);

      const context = manager.buildContext(campaign.id);

      expect(context.worldState).toContain('Phandalin');
    });

    it('respects recent messages budget', () => {
      const campaign = makeCampaign();
      const longContent = 'a'.repeat(5000);
      const messages = Array.from({ length: 20 }, (_, i) =>
        makeMessage('user', longContent, new Date(Date.now() + i * 1000)),
      );
      const store = createMockStore(messages, campaign);
      const manager = new ContextManager(store);

      const context = manager.buildContext(campaign.id);

      const msgTokens = context.recentMessages.reduce(
        (sum, m) => sum + m.content.length / 4 + 4,
        0,
      );
      expect(msgTokens).toBeLessThanOrEqual(RECENT_MESSAGES_BUDGET + 100);
    });

    it('returns empty recent messages when none exist', () => {
      const campaign = makeCampaign();
      const store = createMockStore([], campaign);
      const manager = new ContextManager(store);

      const context = manager.buildContext(campaign.id);
      expect(context.recentMessages).toHaveLength(0);
    });
  });

  describe('compressIfNeeded', () => {
    it('returns false when within budget', () => {
      const campaign = makeCampaign();
      const messages = [makeMessage('user', 'short message')];
      const store = createMockStore(messages, campaign);
      const manager = new ContextManager(store);

      const result = manager.compressIfNeeded(campaign.id);
      expect(result).toBe(false);
    });

    it('returns false for unknown campaign', () => {
      const store = createMockStore();
      const manager = new ContextManager(store);

      const result = manager.compressIfNeeded('nonexistent');
      expect(result).toBe(false);
    });

    it('compresses when messages exceed budget', () => {
      const campaign = makeCampaign();
      const longContent = 'a'.repeat(12000);
      const messages = Array.from({ length: 10 }, (_, i) =>
        makeMessage('user', longContent, new Date(Date.now() + i * 1000)),
      );
      const store = createMockStore(messages, campaign);
      const manager = new ContextManager(store);

      const result = manager.compressIfNeeded(campaign.id);
      expect(result).toBe(true);
    });

    it('updates world state with summary when compressing', () => {
      const campaign = makeCampaign();
      const longContent = 'a'.repeat(12000);
      const messages = Array.from({ length: 10 }, (_, i) =>
        makeMessage('user', longContent, new Date(Date.now() + i * 1000)),
      );
      let updatedWorldState: Campaign['worldState'] | undefined;
      const store: MessageStore = {
        getMessages: () => messages,
        addMessage: () => makeMessage('user', 'x'),
        getCampaign: () => campaign,
        updateWorldState: (_id, ws) => {
          updatedWorldState = ws;
        },
      };
      const manager = new ContextManager(store);

      manager.compressIfNeeded(campaign.id);

      expect(updatedWorldState).toBeDefined();
      expect(updatedWorldState!.events.length).toBeGreaterThan(0);
    });
  });

  describe('addMessage', () => {
    it('stores message and returns it', () => {
      const campaign = makeCampaign();
      const store = createMockStore([], campaign);
      const manager = new ContextManager(store);

      const msg = manager.addMessage(campaign.id, 'user', 'I cast fireball');

      expect(msg.role).toBe('user');
      expect(msg.content).toBe('I cast fireball');
      expect(msg.timestamp).toBeInstanceOf(Date);
    });

    it('triggers compression check after adding', () => {
      const campaign = makeCampaign();
      const longContent = 'a'.repeat(50000);
      let compressCalled = false;
      const store: MessageStore = {
        getMessages: () => Array.from({ length: 10 }, () => makeMessage('user', longContent)),
        addMessage: () => makeMessage('user', 'new'),
        getCampaign: () => campaign,
        updateWorldState: () => {
          compressCalled = true;
        },
      };
      const manager = new ContextManager(store);

      manager.addMessage(campaign.id, 'user', longContent);

      expect(compressCalled).toBe(true);
    });
  });
});
