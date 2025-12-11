import type { LlmRequest, LlmResponse } from '../types';

export class OpenAIProvider {
  constructor(private readonly apiKey: string, private readonly model: string) {}

  async complete(request: LlmRequest): Promise<LlmResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model ?? this.model,
        temperature: request.temperature ?? 0.2,
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.user }
        ],
        response_format: request.response_format
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    return { content, raw: data };
  }
}
