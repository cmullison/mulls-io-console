export const DEFAULT_CHAT_MODEL = 'claude-sonnet-4-20250514';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  provider: 'anthropic' | 'openai' | 'google';
}

export const chatModels: Array<ChatModel> = [
  // Anthropic models (default)
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: 'Balanced performance and speed',
    provider: 'anthropic',
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    description: 'Most capable model for complex tasks',
    provider: 'anthropic',
  },

  // OpenAI models
  {
    id: 'o4-mini',
    name: 'o4-mini',
    description: 'Fast and efficient reasoning model',
    provider: 'openai',
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    description: 'Advanced language model',
    provider: 'openai',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Advanced language model',
    provider: 'openai',
  },
  {
    id: 'o3',
    name: 'o3',
    description: 'Latest reasoning model',
    provider: 'openai',
  },

  // Google models
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Most capable Gemini model',
    provider: 'google',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast and efficient Gemini model',
    provider: 'google',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    description: 'Lightweight Gemini model',
    provider: 'google',
  },
];

export function getChatModelById(id: string): ChatModel | undefined {
  return chatModels.find(model => model.id === id);
}

export function getChatModelsByProvider(provider: string): ChatModel[] {
  return chatModels.filter(model => model.provider === provider);
}