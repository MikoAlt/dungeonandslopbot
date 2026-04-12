import { describe, it, expect } from 'bun:test';
import {
  createBufferMemory,
  createConversationMemory,
  ChatMessageHistory,
} from '../../../src/services/llm/memory';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

describe('LLM Memory', () => {
  describe('createBufferMemory', () => {
    it('creates a BufferMemory instance', () => {
      const memory = createBufferMemory();
      expect(memory).toBeDefined();
      expect(memory.memoryKey).toBe('history');
    });

    it('defaults returnMessages to true', () => {
      const memory = createBufferMemory();
      expect(memory.returnMessages).toBe(true);
    });

    it('accepts custom config', () => {
      const memory = createBufferMemory({
        returnMessages: false,
        inputKey: 'question',
        outputKey: 'answer',
      });

      expect(memory.returnMessages).toBe(false);
    });

    it('stores and retrieves messages', async () => {
      const memory = createBufferMemory();

      await memory.saveContext(
        { input: 'I attack the goblin' },
        { output: 'The goblin takes 5 damage' },
      );

      const result = await memory.loadMemoryVariables({});
      expect(result.history).toBeDefined();
      expect(result.history).toHaveLength(2);
    });

    it('accumulates messages across multiple saves', async () => {
      const memory = createBufferMemory();

      await memory.saveContext(
        { input: 'I enter the dungeon' },
        { output: 'You see a dark corridor' },
      );

      await memory.saveContext(
        { input: 'I light a torch' },
        { output: 'The corridor illuminates' },
      );

      const result = await memory.loadMemoryVariables({});
      expect(result.history).toHaveLength(4);
    });

    it('clears memory correctly', async () => {
      const memory = createBufferMemory();

      await memory.saveContext({ input: 'Hello' }, { output: 'Hi there' });

      await memory.clear();

      const result = await memory.loadMemoryVariables({});
      expect(result.history).toHaveLength(0);
    });
  });

  describe('createConversationMemory', () => {
    it('creates a memory instance', () => {
      const mockLlm = {
        modelName: 'test-model',
        invoke: async () => ({ content: 'summary' }),
      } as never;

      const memory = createConversationMemory(mockLlm);
      expect(memory).toBeDefined();
      expect(memory.memoryKey).toBe('history');
    });

    it('accepts custom config', () => {
      const mockLlm = {
        modelName: 'test-model',
        invoke: async () => ({ content: 'summary' }),
      } as never;

      const memory = createConversationMemory(mockLlm, {
        returnMessages: false,
        inputKey: 'question',
        outputKey: 'answer',
      });

      expect(memory.returnMessages).toBe(false);
    });

    it('stores and retrieves messages like BufferMemory', async () => {
      const mockLlm = {
        modelName: 'test-model',
        invoke: async () => ({ content: 'summary' }),
      } as never;

      const memory = createConversationMemory(mockLlm);

      await memory.saveContext(
        { input: 'I cast fireball' },
        { output: 'The goblins are engulfed in flames' },
      );

      const result = await memory.loadMemoryVariables({});
      expect(result.history).toHaveLength(2);
    });
  });

  describe('ChatMessageHistory', () => {
    it('can be created standalone', () => {
      const history = new ChatMessageHistory();
      expect(history).toBeDefined();
    });

    it('stores messages directly', async () => {
      const history = new ChatMessageHistory();

      await history.addMessage(new HumanMessage('Hello'));
      await history.addMessage(new AIMessage('Hi there'));

      const messages = await history.getMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0]!.content).toBe('Hello');
      expect(messages[1]!.content).toBe('Hi there');
    });
  });
});
