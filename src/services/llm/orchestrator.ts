import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ContextManager } from '../context/manager.js';
import { createLLM, createOpenRouterLLM } from './client.js';
import {
  interpolateTemplate,
  DND5E_SYSTEM_PROMPT,
  CUSTOM_SYSTEM_PROMPT,
  STORY_SUMMARY_PROMPT,
  CHARACTER_SHEET_PROMPT,
} from './prompts.js';
import { parseNarrativeResponse, type ParsedNarrative } from './response.js';

export interface OrchestratorConfig {
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseUrl?: string;
  openRouterApiKey?: string;
  openRouterModel?: string;
}

export interface StoryResult {
  narrative: string;
  diceRolls: ParsedNarrative['diceRolls'];
  stateChanges: ParsedNarrative['stateChanges'];
  rawResponse: string;
}

export interface CharacterSheetResult {
  characterSheet: string;
  rawResponse: string;
}

export interface SummaryResult {
  summary: string;
  rawResponse: string;
}

export interface StreamingResult {
  fullResponse: string;
  parsed: ParsedNarrative;
}

export class LLMOrchestrator {
  private contextManager: ContextManager;
  private llm: BaseChatModel;
  private openRouterLLM: BaseChatModel | null;
  private config: OrchestratorConfig;

  constructor(contextManager: ContextManager, llm: BaseChatModel, config: OrchestratorConfig) {
    this.contextManager = contextManager;
    this.llm = llm;
    this.config = config;
    this.openRouterLLM = null;

    if (config.openRouterApiKey) {
      this.openRouterLLM = createOpenRouterLLM({
        modelName: config.openRouterModel ?? 'openai/gpt-4',
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        apiKey: config.openRouterApiKey,
      });
    }
  }

  async generateStory(campaignId: string, playerAction: string): Promise<StoryResult> {
    const context = this.contextManager.buildContext(campaignId);
    const campaign = this.contextManager.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    const systemTemplate =
      campaign.rpgSystem === 'dnd5e' ? DND5E_SYSTEM_PROMPT : CUSTOM_SYSTEM_PROMPT;
    const systemPrompt = interpolateTemplate(systemTemplate, {
      campaignName: campaign.name,
      characters: context.worldState,
    });

    const response = await this.invokeWithFallback(async (model) => {
      return model.invoke([new SystemMessage(systemPrompt), new HumanMessage(playerAction)]);
    });

    const rawContent =
      typeof response.content === 'string' ? response.content : String(response.content);
    const parsed = parseNarrativeResponse(rawContent);

    this.contextManager.addMessage(campaignId, 'assistant', rawContent);

    return {
      narrative: parsed.narrative,
      diceRolls: parsed.diceRolls,
      stateChanges: parsed.stateChanges,
      rawResponse: rawContent,
    };
  }

  async generateCharacterSheet(
    characterId: string,
    characterData: string,
  ): Promise<CharacterSheetResult> {
    const systemPrompt = interpolateTemplate(CHARACTER_SHEET_PROMPT, {
      characterConcept: characterData,
      rpgSystem: 'dnd5e',
    });

    const response = await this.invokeWithFallback(async (model) => {
      return model.invoke([new SystemMessage(systemPrompt), new HumanMessage(characterData)]);
    });

    const rawContent =
      typeof response.content === 'string' ? response.content : String(response.content);

    return {
      characterSheet: rawContent,
      rawResponse: rawContent,
    };
  }

  async generateSummary(campaignId: string): Promise<SummaryResult> {
    const context = this.contextManager.buildContext(campaignId);
    const campaign = this.contextManager.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    const conversationHistory = context.recentMessages
      .map((m) => `[${m.role}]: ${m.content}`)
      .join('\n');

    const systemPrompt = interpolateTemplate(STORY_SUMMARY_PROMPT, {
      campaignName: campaign.name,
      rpgSystem: campaign.rpgSystem,
      conversationHistory,
    });

    const response = await this.invokeWithFallback(async (model) => {
      return model.invoke([new SystemMessage(systemPrompt), new HumanMessage(conversationHistory)]);
    });

    const rawContent =
      typeof response.content === 'string' ? response.content : String(response.content);

    return {
      summary: rawContent,
      rawResponse: rawContent,
    };
  }

  async handleStreamingResponse(campaignId: string, interaction: string): Promise<StreamingResult> {
    const storyResult = await this.generateStory(campaignId, interaction);

    return {
      fullResponse: storyResult.rawResponse,
      parsed: parseNarrativeResponse(storyResult.rawResponse),
    };
  }

  private async invokeWithFallback(
    fn: (model: BaseChatModel) => Promise<{ content: string | Array<unknown> }>,
  ): Promise<{ content: string | Array<unknown> }> {
    try {
      return await fn(this.llm);
    } catch (primaryError) {
      if (this.openRouterLLM) {
        try {
          return await fn(this.openRouterLLM);
        } catch {
          throw primaryError;
        }
      }
      throw primaryError;
    }
  }
}

export function createOrchestrator(
  contextManager: ContextManager,
  config: OrchestratorConfig,
): LLMOrchestrator {
  const llm = createLLM({
    modelName: config.modelName,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
  });

  return new LLMOrchestrator(contextManager, llm, config);
}
