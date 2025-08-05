import { customProvider } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Initialize AI providers
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_GATEWAY_ACCOUNT_ID && process.env.AI_GATEWAY_ID && process.env.AI_GATEWAY_TOKEN
    ? `https://gateway.ai.cloudflare.com/v1/${process.env.AI_GATEWAY_ACCOUNT_ID}/${process.env.AI_GATEWAY_ID}/openai`
    : undefined,
  headers: process.env.AI_GATEWAY_TOKEN
    ? {
        "cf-aig-authorization": `Bearer ${process.env.AI_GATEWAY_TOKEN}`,
      }
    : undefined,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const aiProvider = customProvider({
  languageModels: {
    // Anthropic models (default)
    'claude-sonnet-4-20250514': anthropic('claude-sonnet-4-20250514'),
    'claude-opus-4-20250514': anthropic('claude-opus-4-20250514'),

    // OpenAI models
    'o4-mini': openai('o4-mini'),
    'gpt-4.1': openai('gpt-4.1'),
    'o3': openai('o3'),

    // Google models
    'gemini-2.5-pro': google('gemini-2.5-pro'),
    'gemini-2.5-flash': google('gemini-2.5-flash'),
    'gemini-2.5-flash-lite': google('gemini-2.5-flash-lite'),
  },
});

export function getModelProvider(modelId: string): 'anthropic' | 'openai' | 'google' | 'unknown' {
  if (modelId.startsWith('claude-')) return 'anthropic';
  if (modelId.startsWith('gpt-') || modelId.startsWith('o4-') || modelId.startsWith('o3')) return 'openai';
  if (modelId.startsWith('gemini-')) return 'google';
  return 'unknown';
}