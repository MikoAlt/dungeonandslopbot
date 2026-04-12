export { createLLM, createOpenRouterLLM } from './client.js';
export type { LLMConfig } from './client.js';

export {
  createCharacterTool,
  getCampaignTool,
  storyAdvanceTool,
  diceRollTool,
  searchMemoryTool,
  allTools,
} from './tools.js';

export {
  createConversationMemory,
  createBufferMemory,
  BufferMemory,
  ChatMessageHistory,
} from './memory.js';
export type { MemoryConfig } from './memory.js';

export {
  createStoryChain,
  createCharacterSheetChain,
  createSummaryChain,
  STORY_SYSTEM_TEMPLATE,
  CHARACTER_SHEET_SYSTEM_TEMPLATE,
  SUMMARY_SYSTEM_TEMPLATE,
} from './chains.js';

export {
  DND5E_SYSTEM_PROMPT,
  CUSTOM_SYSTEM_PROMPT,
  STORY_SUMMARY_PROMPT,
  CHARACTER_SHEET_PROMPT,
  createStoryPromptTemplate,
  createSummaryPromptTemplate,
  createCharacterSheetPromptTemplate,
  interpolateTemplate,
} from './prompts.js';

export { parseNarrativeResponse, parseDiceRolls, parseStateChanges } from './response.js';
export type { ParsedNarrative, DiceRollRequest, StateChange } from './response.js';

export { LLMOrchestrator, createOrchestrator } from './orchestrator.js';
export type {
  OrchestratorConfig,
  StoryResult,
  CharacterSheetResult,
  SummaryResult,
  StreamingResult,
} from './orchestrator.js';
