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
