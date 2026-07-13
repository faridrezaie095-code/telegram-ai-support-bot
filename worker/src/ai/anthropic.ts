import type { AIProvider, CompleteParams } from './types';
import { AIProviderError } from './types';

export class AnthropicProvider implements AIProvider {
  async complete({ systemPrompt, history, userMessage, model, apiKey }: CompleteParams): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        max_tokens: 500,
        messages: [
          ...history.map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new AIProviderError(`Anthropic error: ${errText}`, 'anthropic', res.status);
    }

    const data = await res.json<any>();
    const text = data.content?.[0]?.text;
    if (!text) throw new AIProviderError('پاسخ نامعتبر از Anthropic', 'anthropic');
    return text.trim();
  }
}
