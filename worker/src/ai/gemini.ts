import type { AIProvider, CompleteParams } from './types';
import { AIProviderError } from './types';

export class GeminiProvider implements AIProvider {
  async complete({ systemPrompt, history, userMessage, model, apiKey }: CompleteParams): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = [
      ...history.map((h) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new AIProviderError(`Gemini error: ${errText}`, 'gemini', res.status);
    }

    const data = await res.json<any>();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new AIProviderError('پاسخ نامعتبر از Gemini', 'gemini');
    return text.trim();
  }
}
