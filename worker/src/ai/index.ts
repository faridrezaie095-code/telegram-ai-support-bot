import type { AIProvider } from './types';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';
import { AnthropicProvider } from './anthropic';

const providers: Record<string, () => AIProvider> = {
  openai: () => new OpenAIProvider(),
  gemini: () => new GeminiProvider(),
  anthropic: () => new AnthropicProvider(),
};

export function getAIProvider(name: string): AIProvider {
  const factory = providers[name];
  if (!factory) {
    throw new Error(`پروایدر هوش مصنوعی «${name}» پشتیبانی نمی‌شود`);
  }
  return factory();
}

export const SUPPORTED_PROVIDERS = Object.keys(providers);

export const DEFAULT_MODELS: Record<string, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
  gemini: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  anthropic: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
};

export * from './types';
