import type { AIProvider, CompleteParams } from './types';
import { AIProviderError } from './types';

export class OpenAIProvider implements AIProvider {
  async complete({ systemPrompt, history, userMessage, model, apiKey }: CompleteParams): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: userMessage },
        ],
        temperature: 0.4,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new AIProviderError(`OpenAI error: ${errText}`, 'openai', res.status);
    }

    const data = await res.json<any>();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new AIProviderError('پاسخ نامعتبر از OpenAI', 'openai');
    return text.trim();
  }
}
