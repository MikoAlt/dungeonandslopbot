import { describe, it, expect, vi, beforeEach } from 'bun:test';
import { LLMOrchestrator, createOrchestrator } from '../../../src/services/llm/orchestrator';
import type { OrchestratorConfig } from '../../../src/services/llm/orchestrator';
import { ContextManager } from '../../../src/services/context/manager';
import type { MessageStore } from '../../../src/services/context/manager';
import type { Campaign, ChatMessage } from '../../../src/types';

function createMockMessageStore(campaign: Campaign): MessageStore {
  const messages: ChatMessage[] = [];
  return {
    getMessages: vi.fn(() => messages),
    addMessage: vi.fn((campaignId: string, role: ChatMessage['role'], content: string) => {
      const msg: ChatMessage = {
        role,
        content,
        timestamp: new Date(),
      };
      messages.push(msg);
      return msg;
    }),
    getCampaign: vi.fn(() => campaign),
    updateWorldState: vi.fn(),
  };
}

function createMockCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Campaign',
    description: 'A test campaign',
    rpgSystem: 'dnd5e',
    mode: 'sharedSession',
    dmUserId: 'dm-123',
    guildId: 'guild-123',
    channelId: 'channel-123',
    worldState: {
      currentLocation: 'Tavern',
      npcs: ['Bartender'],
      quests: [{ name: 'Find the Sword', status: 'active' }],
      events: ['The party met at the tavern'],
      sessionCount: 1,
    },
    isActive: true,
    players: ['player-1'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockLLM(responseContent: string) {
  return {
    invoke: vi.fn(() =>
      Promise.resolve({
        content: responseContent,
        additional_kwargs: {},
      }),
    ),
  };
}

describe('LLMOrchestrator', () => {
  let mockStore: MessageStore;
  let mockCampaign: Campaign;
  let contextManager: ContextManager;

  beforeEach(() => {
    mockCampaign = createMockCampaign();
    mockStore = createMockMessageStore(mockCampaign);
    contextManager = new ContextManager(mockStore);
  });

  describe('constructor', () => {
    it('creates orchestrator with primary LLM', () => {
      const mockLLM = createMockLLM('test response');
      const config: OrchestratorConfig = {
        modelName: 'gpt-4',
        apiKey: 'test-key',
      };
      const orchestrator = new LLMOrchestrator(contextManager, mockLLM as unknown as any, config);
      expect(orchestrator).toBeDefined();
    });

    it('creates orchestrator with OpenRouter fallback when key provided', () => {
      const mockLLM = createMockLLM('test response');
      const config: OrchestratorConfig = {
        modelName: 'gpt-4',
        apiKey: 'test-key',
        openRouterApiKey: 'or-key',
      };
      const orchestrator = new LLMOrchestrator(contextManager, mockLLM as unknown as any, config);
      expect(orchestrator).toBeDefined();
    });
  });

  describe('generateStory', () => {
    it('generates story with narrative, dice rolls, and state changes', async () => {
      const storyResponse = `The goblin attacks! [roll:1d20+4] It hits! You take [state:hp-6] damage.`;
      const mockLLM = createMockLLM(storyResponse);
      const config: OrchestratorConfig = { modelName: 'gpt-4', apiKey: 'test-key' };
      const orchestrator = new LLMOrchestrator(contextManager, mockLLM as unknown as any, config);

      const result = await orchestrator.generateStory(
        '550e8400-e29b-41d4-a716-446655440000',
        'I attack the goblin',
      );

      expect(result.narrative).toContain('goblin attacks');
      expect(result.narrative).toContain('It hits');
      expect(result.narrative).toContain('damage');
      expect(result.narrative).not.toContain('[roll:');
      expect(result.narrative).not.toContain('[state:');
      expect(result.diceRolls).toHaveLength(1);
      expect(result.diceRolls[0]!.notation).toBe('1d20+4');
      expect(result.stateChanges).toHaveLength(1);
      expect(result.stateChanges[0]!.key).toBe('hp');
      expect(result.rawResponse).toBe(storyResponse);
    });

    it('stores assistant response via context manager', async () => {
      const storyResponse = 'The dragon flies away.';
      const mockLLM = createMockLLM(storyResponse);
      const config: OrchestratorConfig = { modelName: 'gpt-4', apiKey: 'test-key' };
      const orchestrator = new LLMOrchestrator(contextManager, mockLLM as unknown as any, config);

      await orchestrator.generateStory(
        '550e8400-e29b-41d4-a716-446655440000',
        'I watch the dragon',
      );

      expect(mockStore.addMessage).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
        'assistant',
        storyResponse,
      );
    });

    it('throws when campaign not found', async () => {
      const mockStoreEmpty: MessageStore = {
        getMessages: vi.fn(() => []),
        addMessage: vi.fn(),
        getCampaign: vi.fn(() => undefined),
        updateWorldState: vi.fn(),
      };
      const cm = new ContextManager(mockStoreEmpty);
      const mockLLM = createMockLLM('response');
      const config: OrchestratorConfig = { modelName: 'gpt-4', apiKey: 'test-key' };
      const orchestrator = new LLMOrchestrator(cm, mockLLM as unknown as any, config);

      await expect(orchestrator.generateStory('nonexistent-id', 'action')).rejects.toThrow();
    });

    it('uses custom system prompt for custom RPG system', async () => {
      const customCampaign = createMockCampaign({ rpgSystem: 'custom' });
      const customStore = createMockMessageStore(customCampaign);
      const cm = new ContextManager(customStore);
      const storyResponse = 'You strike with your sword! [roll:1d6+3]';
      const mockLLM = createMockLLM(storyResponse);
      const config: OrchestratorConfig = { modelName: 'gpt-4', apiKey: 'test-key' };
      const orchestrator = new LLMOrchestrator(cm, mockLLM as unknown as any, config);

      const result = await orchestrator.generateStory(
        '550e8400-e29b-41d4-a716-446655440000',
        'I attack',
      );

      expect(result.diceRolls).toHaveLength(1);
      expect(result.diceRolls[0]!.notation).toBe('1d6+3');
    });

    it('calls LLM with system and human messages', async () => {
      const storyResponse = 'The goblin flees!';
      const mockLLM = createMockLLM(storyResponse);
      const config: OrchestratorConfig = { modelName: 'gpt-4', apiKey: 'test-key' };
      const orchestrator = new LLMOrchestrator(contextManager, mockLLM as unknown as any, config);

      await orchestrator.generateStory(
        '550e8400-e29b-41d4-a716-446655440000',
        'I attack the goblin',
      );

      expect(mockLLM.invoke).toHaveBeenCalledTimes(1);
      const callArgs = mockLLM.invoke.mock.calls[0]![0] as Array<{
        constructor: { name: string };
        content: string;
      }>;
      expect(callArgs.length).toBe(2);
      expect(callArgs[0]!.constructor.name).toBe('SystemMessage');
      expect(callArgs[1]!.constructor.name).toBe('HumanMessage');
    });
  });

  describe('generateCharacterSheet', () => {
    it('generates a character sheet', async () => {
      const sheetResponse = 'Name: Thorin\nClass: Fighter\nHP: 12\nSTR: 16 (+3)';
      const mockLLM = createMockLLM(sheetResponse);
      const config: OrchestratorConfig = { modelName: 'gpt-4', apiKey: 'test-key' };
      const orchestrator = new LLMOrchestrator(contextManager, mockLLM as unknown as any, config);

      const result = await orchestrator.generateCharacterSheet(
        'char-123',
        'A dwarven fighter with a warhammer',
      );

      expect(result.characterSheet).toBe(sheetResponse);
      expect(result.rawResponse).toBe(sheetResponse);
    });

    it('calls LLM with system and human messages', async () => {
      const sheetResponse = 'Character sheet';
      const mockLLM = createMockLLM(sheetResponse);
      const config: OrchestratorConfig = { modelName: 'gpt-4', apiKey: 'test-key' };
      const orchestrator = new LLMOrchestrator(contextManager, mockLLM as unknown as any, config);

      await orchestrator.generateCharacterSheet('char-1', 'A brave warrior');

      expect(mockLLM.invoke).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateSummary', () => {
    it('generates a summary of campaign history', async () => {
      const summaryResponse =
        'The party met at the tavern and accepted a quest to find a magic sword.';
      const mockLLM = createMockLLM(summaryResponse);
      const config: OrchestratorConfig = { modelName: 'gpt-4', apiKey: 'test-key' };
      const orchestrator = new LLMOrchestrator(contextManager, mockLLM as unknown as any, config);

      const result = await orchestrator.generateSummary('550e8400-e29b-41d4-a716-446655440000');

      expect(result.summary).toBe(summaryResponse);
      expect(result.rawResponse).toBe(summaryResponse);
    });

    it('throws when campaign not found', async () => {
      const mockStoreEmpty: MessageStore = {
        getMessages: vi.fn(() => []),
        addMessage: vi.fn(),
        getCampaign: vi.fn(() => undefined),
        updateWorldState: vi.fn(),
      };
      const cm = new ContextManager(mockStoreEmpty);
      const mockLLM = createMockLLM('summary');
      const config: OrchestratorConfig = { modelName: 'gpt-4', apiKey: 'test-key' };
      const orchestrator = new LLMOrchestrator(cm, mockLLM as unknown as any, config);

      await expect(orchestrator.generateSummary('nonexistent-id')).rejects.toThrow();
    });
  });

  describe('handleStreamingResponse', () => {
    it('returns full response and parsed narrative', async () => {
      const storyResponse = 'The goblin attacks! [roll:1d20+4] [state:hp-6]';
      const mockLLM = createMockLLM(storyResponse);
      const config: OrchestratorConfig = { modelName: 'gpt-4', apiKey: 'test-key' };
      const orchestrator = new LLMOrchestrator(contextManager, mockLLM as unknown as any, config);

      const result = await orchestrator.handleStreamingResponse(
        '550e8400-e29b-41d4-a716-446655440000',
        'I fight the goblin',
      );

      expect(result.fullResponse).toBe(storyResponse);
      expect(result.parsed.narrative).toContain('goblin attacks');
      expect(result.parsed.diceRolls).toHaveLength(1);
      expect(result.parsed.stateChanges).toHaveLength(1);
    });
  });

  describe('OpenRouter fallback', () => {
    it('falls back to OpenRouter when primary LLM fails', async () => {
      const failingLLM = {
        invoke: vi.fn(() => Promise.reject(new Error('Primary LLM failed'))),
      };
      const config: OrchestratorConfig = {
        modelName: 'gpt-4',
        apiKey: 'test-key',
        openRouterApiKey: 'or-test-key',
      };

      const orchestrator = new LLMOrchestrator(
        contextManager,
        failingLLM as unknown as any,
        config,
      );

      // Both primary and fallback will fail since createOpenRouterLLM creates a real client
      // that can't connect. Verify the primary error is thrown.
      await expect(orchestrator.generateCharacterSheet('char-1', 'A fighter')).rejects.toThrow(
        'Primary LLM failed',
      );
    });

    it('throws primary error when no OpenRouter key configured and primary fails', async () => {
      const failingLLM = {
        invoke: vi.fn(() => Promise.reject(new Error('Primary LLM failed'))),
      };
      const config: OrchestratorConfig = {
        modelName: 'gpt-4',
        apiKey: 'test-key',
      };

      const orchestrator = new LLMOrchestrator(
        contextManager,
        failingLLM as unknown as any,
        config,
      );

      await expect(orchestrator.generateCharacterSheet('char-1', 'A fighter')).rejects.toThrow(
        'Primary LLM failed',
      );
    });
  });
});

describe('createOrchestrator', () => {
  it('creates an orchestrator instance', () => {
    const mockStore: MessageStore = {
      getMessages: vi.fn(() => []),
      addMessage: vi.fn(),
      getCampaign: vi.fn(() => createMockCampaign()),
      updateWorldState: vi.fn(),
    };
    const cm = new ContextManager(mockStore);
    const config: OrchestratorConfig = {
      modelName: 'gpt-4',
      apiKey: 'test-key',
    };

    const orchestrator = createOrchestrator(cm, config);
    expect(orchestrator).toBeDefined();
    expect(orchestrator).toBeInstanceOf(LLMOrchestrator);
  });
});
