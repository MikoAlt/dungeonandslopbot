import { ChatOpenAI } from '@langchain/openai';

export interface LLMConfig {
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string;
  apiKey?: string;
}

export const DEFAULT_LLM_CONFIG: Required<Pick<LLMConfig, 'temperature' | 'maxTokens'>> = {
  temperature: 0.7,
  maxTokens: 4000,
};

export function createLLM(config: LLMConfig): ChatOpenAI {
  const temperature = config.temperature ?? DEFAULT_LLM_CONFIG.temperature;
  const maxTokens = config.maxTokens ?? DEFAULT_LLM_CONFIG.maxTokens;

  const apiKey = config.apiKey ?? process.env.LLM_API_KEY ?? '';
  const baseUrl = config.baseUrl ?? process.env.LLM_API_URL;

  const llmConfig: ConstructorParameters<typeof ChatOpenAI>[0] = {
    modelName: config.modelName,
    temperature,
    maxTokens,
    openAIApiKey: apiKey,
  };

  if (baseUrl) {
    llmConfig.configuration = {
      baseURL: baseUrl,
    };
  }

  return new ChatOpenAI(llmConfig);
}

export function createOpenRouterLLM(
  config: Omit<LLMConfig, 'baseUrl' | 'apiKey'> & { apiKey?: string },
): ChatOpenAI {
  const apiKey = config.apiKey ?? process.env.OPENROUTER_API_KEY ?? '';
  return createLLM({
    ...config,
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey,
  });
}
