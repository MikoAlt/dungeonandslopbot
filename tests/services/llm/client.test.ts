import { describe, it, expect } from 'bun:test';
import { createLLM, createOpenRouterLLM } from '../../../src/services/llm/client';

describe('LLM Client', () => {
  describe('createLLM', () => {
    it('creates a ChatOpenAI instance with required config', () => {
      const llm = createLLM({
        modelName: 'gpt-4',
        apiKey: 'test-key',
      });

      expect(llm).toBeDefined();
      expect(llm.model).toBe('gpt-4');
    });

    it('applies default temperature and maxTokens', () => {
      const llm = createLLM({
        modelName: 'gpt-4',
        apiKey: 'test-key',
      });

      expect(llm.temperature).toBe(0.7);
      expect(llm.maxTokens).toBe(4000);
    });

    it('allows overriding temperature and maxTokens', () => {
      const llm = createLLM({
        modelName: 'gpt-4',
        apiKey: 'test-key',
        temperature: 0.3,
        maxTokens: 2000,
      });

      expect(llm.temperature).toBe(0.3);
      expect(llm.maxTokens).toBe(2000);
    });

    it('creates instance with custom baseUrl via configuration', () => {
      const llm = createLLM({
        modelName: 'gpt-4',
        apiKey: 'test-key',
        baseUrl: 'https://custom-api.example.com/v1',
      });

      expect(llm).toBeDefined();
    });

    it('uses environment variables as fallback for apiKey and baseUrl', () => {
      const originalUrl = process.env.LLM_API_URL;
      const originalKey = process.env.LLM_API_KEY;

      process.env.LLM_API_URL = 'https://env-api.example.com/v1';
      process.env.LLM_API_KEY = 'env-test-key';

      const llm = createLLM({
        modelName: 'gpt-4',
      });

      expect(llm).toBeDefined();

      process.env.LLM_API_URL = originalUrl;
      process.env.LLM_API_KEY = originalKey;
    });

    it('uses empty string as default apiKey when none provided', () => {
      const originalKey = process.env.LLM_API_KEY;
      delete process.env.LLM_API_KEY;

      const llm = createLLM({
        modelName: 'gpt-4',
      });

      expect(llm).toBeDefined();

      process.env.LLM_API_KEY = originalKey;
    });
  });

  describe('createOpenRouterLLM', () => {
    it('creates a ChatOpenAI instance with OpenRouter base URL', () => {
      const llm = createOpenRouterLLM({
        modelName: 'openai/gpt-4',
        apiKey: 'or-test-key',
      });

      expect(llm).toBeDefined();
      expect(llm.model).toBe('openai/gpt-4');
    });

    it('uses OPENROUTER_API_KEY environment variable as fallback', () => {
      const originalKey = process.env.OPENROUTER_API_KEY;
      process.env.OPENROUTER_API_KEY = 'or-env-key';

      const llm = createOpenRouterLLM({
        modelName: 'openai/gpt-4',
      });

      expect(llm).toBeDefined();

      process.env.OPENROUTER_API_KEY = originalKey;
    });

    it('applies custom temperature and maxTokens', () => {
      const llm = createOpenRouterLLM({
        modelName: 'openai/gpt-4',
        apiKey: 'or-test-key',
        temperature: 0.5,
        maxTokens: 3000,
      });

      expect(llm.temperature).toBe(0.5);
      expect(llm.maxTokens).toBe(3000);
    });
  });
});
