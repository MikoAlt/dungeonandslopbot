import { describe, it, expect } from 'bun:test';
import {
  summarizeMessages,
  selectRelevantHistory,
  buildSystemPrompt,
  formatWorldState,
  estimateContextTokens,
} from '../../../src/services/context/compressor';
import type { ChatMessage, Campaign } from '../../../src/types/index';
import { countTokens } from '../../../src/services/context/tokenizer';

function makeMessage(role: ChatMessage['role'], content: string, ts?: Date): ChatMessage {
  return { role, content, timestamp: ts ?? new Date() };
}

function makeCampaign(overrides?: Partial<Campaign['worldState']>): Campaign {
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
      events: ['Dragon spotted'],
      sessionCount: 5,
      ...overrides,
    },
    isActive: true,
    players: ['player1', 'player2'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('summarizeMessages', () => {
  it('returns empty summary for empty array', () => {
    const result = summarizeMessages([]);
    expect(result.originalCount).toBe(0);
    expect(result.summary).toBe('');
  });

  it('concatenates messages with role prefix', () => {
    const messages = [
      makeMessage('user', 'I attack the goblin'),
      makeMessage('assistant', 'The goblin takes 5 damage'),
    ];
    const result = summarizeMessages(messages);
    expect(result.originalCount).toBe(2);
    expect(result.summary).toContain('[user]: I attack the goblin');
    expect(result.summary).toContain('[assistant]: The goblin takes 5 damage');
  });

  it('sorts messages by timestamp', () => {
    const earlier = new Date('2024-01-01');
    const later = new Date('2024-01-02');
    const messages = [
      makeMessage('assistant', 'Later message', later),
      makeMessage('user', 'Earlier message', earlier),
    ];
    const result = summarizeMessages(messages);
    const userIdx = result.summary.indexOf('[user]');
    const asstIdx = result.summary.indexOf('[assistant]');
    expect(userIdx).toBeLessThan(asstIdx);
  });

  it('captures timestamp range', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-03');
    const messages = [makeMessage('user', 'msg1', start), makeMessage('user', 'msg2', end)];
    const result = summarizeMessages(messages);
    expect(result.timestampRange.start).toEqual(start);
    expect(result.timestampRange.end).toEqual(end);
  });
});

describe('selectRelevantHistory', () => {
  it('returns empty array (placeholder)', () => {
    const result = selectRelevantHistory('goblin attack', 'campaign-1', 10);
    expect(result).toEqual([]);
  });
});

describe('buildSystemPrompt', () => {
  it('includes RPG system and mode', () => {
    const campaign = makeCampaign();
    const prompt = buildSystemPrompt(campaign, []);
    expect(prompt).toContain('dnd5e');
    expect(prompt).toContain('sharedSession');
  });

  it('includes campaign name and description', () => {
    const campaign = makeCampaign();
    const prompt = buildSystemPrompt(campaign, []);
    expect(prompt).toContain('Test Campaign');
    expect(prompt).toContain('A test campaign');
  });

  it('includes DM and players', () => {
    const campaign = makeCampaign();
    const prompt = buildSystemPrompt(campaign, []);
    expect(prompt).toContain('dm123');
    expect(prompt).toContain('player1');
  });

  it('includes characters when provided', () => {
    const campaign = makeCampaign();
    const prompt = buildSystemPrompt(campaign, ['Gandalf the Grey', 'Frodo']);
    expect(prompt).toContain('Gandalf the Grey');
    expect(prompt).toContain('Frodo');
  });

  it('includes DM rules section', () => {
    const campaign = makeCampaign();
    const prompt = buildSystemPrompt(campaign, []);
    expect(prompt).toContain('Dungeon Master');
  });

  it('handles empty players list', () => {
    const campaign = makeCampaign();
    campaign.players = [];
    const prompt = buildSystemPrompt(campaign, []);
    expect(prompt).toContain('None');
  });
});

describe('formatWorldState', () => {
  it('formats location', () => {
    const campaign = makeCampaign();
    const result = formatWorldState(campaign.worldState);
    expect(result).toContain('Phandalin');
  });

  it('formats NPCs', () => {
    const campaign = makeCampaign();
    const result = formatWorldState(campaign.worldState);
    expect(result).toContain('Gundren Rockseeker');
  });

  it('formats quests with status', () => {
    const campaign = makeCampaign();
    const result = formatWorldState(campaign.worldState);
    expect(result).toContain('Lost Mine');
    expect(result).toContain('active');
  });

  it('formats events', () => {
    const campaign = makeCampaign();
    const result = formatWorldState(campaign.worldState);
    expect(result).toContain('Dragon spotted');
  });

  it('omits NPCs section when empty', () => {
    const campaign = makeCampaign({ npcs: [], currentLocation: 'Town' });
    const result = formatWorldState(campaign.worldState);
    expect(result).not.toContain('NPCs:');
  });

  it('truncates to maxTokens budget', () => {
    const campaign = makeCampaign({
      currentLocation: 'A'.repeat(20000),
      npcs: [],
      quests: [],
      events: [],
      sessionCount: 0,
    });
    const result = formatWorldState(campaign.worldState, 100);
    expect(countTokens(result)).toBeLessThanOrEqual(100);
  });
});

describe('estimateContextTokens', () => {
  it('counts tokens from all sections', () => {
    const messages = [makeMessage('user', 'hello world')];
    const ragResults = ['relevant passage'];
    const total = estimateContextTokens('system prompt', 'world state', messages, ragResults);
    const expected =
      countTokens('system prompt') +
      countTokens('world state') +
      countTokens('hello world') +
      4 +
      countTokens('relevant passage');
    expect(total).toBe(expected);
  });

  it('handles empty messages and RAG results', () => {
    const total = estimateContextTokens('system', 'world', [], []);
    expect(total).toBe(countTokens('system') + countTokens('world'));
  });
});
