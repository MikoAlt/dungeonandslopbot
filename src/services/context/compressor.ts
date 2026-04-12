import type { ChatMessage, Campaign } from '../../types/index.js';
import { countTokens, truncateToTokens } from './tokenizer.js';
import { WORLD_STATE_BUDGET } from './budget.js';

export interface MessageSummary {
  originalCount: number;
  summary: string;
  timestampRange: { start: Date; end: Date };
}

export function summarizeMessages(messages: ChatMessage[]): MessageSummary {
  if (messages.length === 0) {
    const now = new Date();
    return {
      originalCount: 0,
      summary: '',
      timestampRange: { start: now, end: now },
    };
  }

  const sorted = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const concatenated = sorted.map((m) => `[${m.role}]: ${m.content}`).join('\n');

  return {
    originalCount: messages.length,
    summary: concatenated,
    timestampRange: {
      start: sorted[0]!.timestamp,
      end: sorted[sorted.length - 1]!.timestamp,
    },
  };
}

export function selectRelevantHistory(
  _query: string,
  _campaignId: string,
  _limit: number,
): string[] {
  return [];
}

export function buildSystemPrompt(campaign: Campaign, characters: string[]): string {
  const lines: string[] = [
    '=== RPG System ===',
    `System: ${campaign.rpgSystem}`,
    `Mode: ${campaign.mode}`,
    '',
    '=== Campaign ===',
    `Name: ${campaign.name}`,
    `Description: ${campaign.description}`,
    `DM: ${campaign.dmUserId}`,
    `Players: ${campaign.players.join(', ') || 'None'}`,
  ];

  if (characters.length > 0) {
    lines.push('', '=== Characters ===');
    for (const char of characters) {
      lines.push(`- ${char}`);
    }
  }

  lines.push('', '=== Rules ===');
  lines.push('You are the Dungeon Master. Narrate the story, control NPCs, and adjudicate rules.');
  lines.push(
    'Stay in character. Describe scenes vividly. Respond to player actions with consequences.',
  );

  return lines.join('\n');
}

export function formatWorldState(
  worldState: Campaign['worldState'],
  maxTokens: number = WORLD_STATE_BUDGET,
): string {
  const lines: string[] = ['=== World State ===', `Location: ${worldState.currentLocation}`];

  if (worldState.npcs.length > 0) {
    lines.push(`NPCs: ${worldState.npcs.join(', ')}`);
  }

  if (worldState.quests.length > 0) {
    lines.push('Quests:');
    for (const quest of worldState.quests) {
      lines.push(`  - ${quest.name} [${quest.status}]`);
    }
  }

  if (worldState.events.length > 0) {
    lines.push(`Recent Events: ${worldState.events.join('; ')}`);
  }

  lines.push(`Session: ${worldState.sessionCount}`);

  const full = lines.join('\n');
  return truncateToTokens(full, maxTokens);
}

export function estimateContextTokens(
  systemPrompt: string,
  worldState: string,
  recentMessages: ChatMessage[],
  ragResults: string[],
): number {
  let total = countTokens(systemPrompt);
  total += countTokens(worldState);
  total += recentMessages.reduce((sum, m) => sum + countTokens(m.content) + 4, 0);
  total += ragResults.reduce((sum, r) => sum + countTokens(r), 0);
  return total;
}
