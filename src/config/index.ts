import { z } from 'zod';

export const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  LLM_API_URL: z.string().url(),
  LLM_API_KEY: z.string().min(1),
  LLM_MODEL_NAME: z.string().default('gpt-4'),
  OPENROUTER_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function loadConfig(): EnvConfig {
  const raw = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    DATABASE_URL: process.env.DATABASE_URL,
    LLM_API_URL: process.env.LLM_API_URL,
    LLM_API_KEY: process.env.LLM_API_KEY,
    LLM_MODEL_NAME: process.env.LLM_MODEL_NAME,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  };

  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Config validation failed: ${errors}`);
  }

  return result.data;
}
