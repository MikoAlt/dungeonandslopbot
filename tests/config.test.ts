import { envSchema } from '../src/config/index';
import { z } from 'zod';

describe('envSchema', () => {
  const validConfig = {
    DISCORD_TOKEN: 'test-token',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    LLM_API_URL: 'https://api.test.com/v1',
    LLM_API_KEY: 'test-key',
  };

  it('accepts valid config', () => {
    const result = envSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('rejects missing DISCORD_TOKEN', () => {
    const result = envSchema.safeParse({
      ...validConfig,
      DISCORD_TOKEN: undefined,
    });
    expect(result.success).toBe(false);
    const error = result.error.errors.find((e) => e.path.includes('DISCORD_TOKEN'));
    expect(error).toBeDefined();
  });

  it('rejects missing DATABASE_URL', () => {
    const result = envSchema.safeParse({
      ...validConfig,
      DATABASE_URL: undefined,
    });
    expect(result.success).toBe(false);
    const error = result.error.errors.find((e) => e.path.includes('DATABASE_URL'));
    expect(error).toBeDefined();
  });

  it('rejects invalid LLM_API_URL (not a URL)', () => {
    const result = envSchema.safeParse({
      ...validConfig,
      LLM_API_URL: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('defaults LLM_MODEL_NAME to gpt-4', () => {
    const result = envSchema.safeParse({
      ...validConfig,
      LLM_MODEL_NAME: undefined,
    });
    expect(result.success).toBe(true);
    expect(result.data?.LLM_MODEL_NAME).toBe('gpt-4');
  });

  it('allows missing OPENROUTER_API_KEY', () => {
    const result = envSchema.safeParse({
      ...validConfig,
      OPENROUTER_API_KEY: undefined,
    });
    expect(result.success).toBe(true);
  });
});
