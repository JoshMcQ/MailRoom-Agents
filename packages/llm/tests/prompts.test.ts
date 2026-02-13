import { describe, expect, it } from 'vitest';
import { CLASSIFY_PROMPT, DRAFT_REPLY_PROMPT } from '../src/prompts';
import { complete } from '../src/llm';

describe('LLM prompts', () => {
  it('includes safety instructions', () => {
    expect(CLASSIFY_PROMPT).toContain('never fabricate');
    expect(DRAFT_REPLY_PROMPT).toContain('Never fabricate');
  });

  it('mock provider responds with deterministic payload', async () => {
    delete process.env.OPENAI_API_KEY;
    const response = await complete({ system: 'test', user: 'hi' });
    expect(() => JSON.parse(response.content)).not.toThrow();
  });
});
