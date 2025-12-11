import { OpenAIProvider } from './providers/openai';
import type { LlmProvider, LlmRequest, LlmResponse } from './types';

class MockProvider implements LlmProvider {
  async complete(_: LlmRequest): Promise<LlmResponse> {
    return {
      content: JSON.stringify({
        intent: 'other',
        sentiment: 'neu',
        urgency: 'low',
        confidence: 0.1,
        html: '<p>Mock draft</p>',
        text: 'Mock draft'
      })
    };
  }
}

let cachedProvider: LlmProvider | null = null;

export function getProvider(): LlmProvider {
  if (cachedProvider) return cachedProvider;

  const provider = process.env.LLM_PROVIDER ?? 'openai';
  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    cachedProvider = new OpenAIProvider(process.env.OPENAI_API_KEY, process.env.LLM_MODEL ?? 'gpt-4o-mini');
    return cachedProvider;
  }

  cachedProvider = new MockProvider();
  return cachedProvider;
}
