import type { ChatMessage } from '../types';

export interface CompleteParams {
  systemPrompt: string;
  history: ChatMessage[];
  userMessage: string;
  model: string;
  apiKey: string;
}

export interface AIProvider {
  complete(params: CompleteParams): Promise<string>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
