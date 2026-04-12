import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import type { BaseChatMemory } from 'langchain/memory';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

export interface MemoryConfig {
  returnMessages?: boolean;
  inputKey?: string;
  outputKey?: string;
}

export const DEFAULT_MEMORY_CONFIG: Required<MemoryConfig> = {
  returnMessages: true,
  inputKey: 'input',
  outputKey: 'output',
};

export function createConversationMemory(
  _llm: BaseChatModel,
  config?: MemoryConfig,
): BaseChatMemory {
  const chatHistory = new ChatMessageHistory();

  return new BufferMemory({
    chatHistory,
    returnMessages: config?.returnMessages ?? DEFAULT_MEMORY_CONFIG.returnMessages,
    inputKey: config?.inputKey ?? DEFAULT_MEMORY_CONFIG.inputKey,
    outputKey: config?.outputKey ?? DEFAULT_MEMORY_CONFIG.outputKey,
    memoryKey: 'history',
  });
}

export function createBufferMemory(config?: MemoryConfig): BufferMemory {
  const chatHistory = new ChatMessageHistory();

  return new BufferMemory({
    chatHistory,
    returnMessages: config?.returnMessages ?? DEFAULT_MEMORY_CONFIG.returnMessages,
    inputKey: config?.inputKey ?? DEFAULT_MEMORY_CONFIG.inputKey,
    outputKey: config?.outputKey ?? DEFAULT_MEMORY_CONFIG.outputKey,
    memoryKey: 'history',
  });
}

export { BufferMemory, ChatMessageHistory };
