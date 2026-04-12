import type { ChatMessage, ContextWindow, Campaign } from '../../types/index.js';
import { countTokens, truncateToTokens, countMessageTokens } from './tokenizer.js';
import {
  allocate,
  isWithinBudget,
  maxUsableTokens,
  SYSTEM_PROMPT_BUDGET,
  RECENT_MESSAGES_BUDGET,
  RAG_BUDGET,
} from './budget.js';
import {
  summarizeMessages,
  selectRelevantHistory,
  buildSystemPrompt,
  formatWorldState,
  estimateContextTokens,
} from './compressor.js';

export interface MessageStore {
  getMessages(campaignId: string): ChatMessage[];
  addMessage(campaignId: string, role: ChatMessage['role'], content: string): ChatMessage;
  getCampaign(campaignId: string): Campaign | undefined;
  updateWorldState(campaignId: string, worldState: Campaign['worldState']): void;
}

export class ContextManager {
  private store: MessageStore;

  constructor(store: MessageStore) {
    this.store = store;
  }

  buildContext(campaignId: string): ContextWindow {
    const campaign = this.store.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    const budget = allocate({});

    const systemPrompt = truncateToTokens(
      buildSystemPrompt(campaign, []),
      budget.allocated.systemPrompt,
    );

    const worldState = formatWorldState(campaign.worldState, budget.allocated.worldState);

    const allMessages = this.store.getMessages(campaignId);
    const recentMessages = this.selectRecentMessages(allMessages, budget.allocated.recentMessages);

    const ragResults = selectRelevantHistory(
      recentMessages.map((m) => m.content).join(' '),
      campaignId,
      budget.allocated.ragResults,
    );

    const totalTokens = estimateContextTokens(systemPrompt, worldState, recentMessages, ragResults);

    return {
      system: systemPrompt,
      worldState,
      recentMessages,
      ragResults,
      totalTokens,
    };
  }

  compressIfNeeded(campaignId: string): boolean {
    const campaign = this.store.getCampaign(campaignId);
    if (!campaign) return false;

    const allMessages = this.store.getMessages(campaignId);
    const totalTokens = allMessages.reduce(
      (sum, m) => sum + countMessageTokens(m.content, m.role),
      0,
    );

    if (isWithinBudget(totalTokens)) {
      return false;
    }

    const recentWindow = this.selectRecentMessages(allMessages, RECENT_MESSAGES_BUDGET);
    const olderMessages = allMessages.filter((m) => !recentWindow.includes(m));

    if (olderMessages.length > 0) {
      const summary = summarizeMessages(olderMessages);
      const existingEvents = campaign.worldState.events;
      const updatedWorldState = {
        ...campaign.worldState,
        events: [
          ...existingEvents,
          `[Summary of ${summary.originalCount} messages]: ${summary.summary}`,
        ],
      };
      this.store.updateWorldState(campaignId, updatedWorldState);
    }

    return true;
  }

  getCampaign(campaignId: string): Campaign | undefined {
    return this.store.getCampaign(campaignId);
  }

  addMessage(campaignId: string, role: ChatMessage['role'], content: string): ChatMessage {
    const message = this.store.addMessage(campaignId, role, content);
    this.compressIfNeeded(campaignId);
    return message;
  }

  private selectRecentMessages(messages: ChatMessage[], budgetTokens: number): ChatMessage[] {
    if (messages.length === 0) return [];

    const sorted = [...messages].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const selected: ChatMessage[] = [];
    let usedTokens = 0;

    for (const msg of sorted) {
      const msgTokens = countMessageTokens(msg.content, msg.role);
      if (usedTokens + msgTokens > budgetTokens) break;
      selected.push(msg);
      usedTokens += msgTokens;
    }

    return selected.reverse();
  }
}
