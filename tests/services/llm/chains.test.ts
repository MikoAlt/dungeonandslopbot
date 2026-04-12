import { describe, it, expect } from 'bun:test';
import {
  createStoryChain,
  createCharacterSheetChain,
  createSummaryChain,
  STORY_SYSTEM_TEMPLATE,
  CHARACTER_SHEET_SYSTEM_TEMPLATE,
  SUMMARY_SYSTEM_TEMPLATE,
} from '../../../src/services/llm/chains';
import { createLLM } from '../../../src/services/llm/client';
import { createBufferMemory } from '../../../src/services/llm/memory';
import { allTools } from '../../../src/services/llm/tools';

describe('LLM Chains', () => {
  describe('createStoryChain', () => {
    it('creates a chain with LLM, memory, and tools', () => {
      const llm = createLLM({ modelName: 'gpt-4', apiKey: 'test-key' });
      const memory = createBufferMemory();
      const tools = [...allTools];

      const chain = createStoryChain(llm, memory, tools);

      expect(chain).toBeDefined();
    });

    it('creates a chain without tools', () => {
      const llm = createLLM({ modelName: 'gpt-4', apiKey: 'test-key' });
      const memory = createBufferMemory();

      const chain = createStoryChain(llm, memory, []);

      expect(chain).toBeDefined();
    });

    it('chain is a runnable pipeline', () => {
      const llm = createLLM({ modelName: 'gpt-4', apiKey: 'test-key' });
      const memory = createBufferMemory();

      const chain = createStoryChain(llm, memory, []);

      expect(chain.pipe).toBeDefined();
      expect(chain.invoke).toBeDefined();
    });
  });

  describe('createCharacterSheetChain', () => {
    it('creates a chain with LLM', () => {
      const llm = createLLM({ modelName: 'gpt-4', apiKey: 'test-key' });

      const chain = createCharacterSheetChain(llm);

      expect(chain).toBeDefined();
    });

    it('chain is a runnable pipeline', () => {
      const llm = createLLM({ modelName: 'gpt-4', apiKey: 'test-key' });

      const chain = createCharacterSheetChain(llm);

      expect(chain.pipe).toBeDefined();
      expect(chain.invoke).toBeDefined();
    });
  });

  describe('createSummaryChain', () => {
    it('creates a chain with LLM', () => {
      const llm = createLLM({ modelName: 'gpt-4', apiKey: 'test-key' });

      const chain = createSummaryChain(llm);

      expect(chain).toBeDefined();
    });

    it('chain is a runnable pipeline', () => {
      const llm = createLLM({ modelName: 'gpt-4', apiKey: 'test-key' });

      const chain = createSummaryChain(llm);

      expect(chain.pipe).toBeDefined();
      expect(chain.invoke).toBeDefined();
    });
  });

  describe('prompt templates', () => {
    it('STORY_SYSTEM_TEMPLATE contains DM instructions', () => {
      expect(STORY_SYSTEM_TEMPLATE).toContain('Dungeon Master');
      expect(STORY_SYSTEM_TEMPLATE).toContain('{rpgSystem}');
      expect(STORY_SYSTEM_TEMPLATE).toContain('{campaignName}');
    });

    it('CHARACTER_SHEET_SYSTEM_TEMPLATE contains character generation instructions', () => {
      expect(CHARACTER_SHEET_SYSTEM_TEMPLATE).toContain('character');
      expect(CHARACTER_SHEET_SYSTEM_TEMPLATE).toContain('{rpgSystem}');
    });

    it('SUMMARY_SYSTEM_TEMPLATE contains summarization instructions', () => {
      expect(SUMMARY_SYSTEM_TEMPLATE).toContain('summar');
    });
  });
});
