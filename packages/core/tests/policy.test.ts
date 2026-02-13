import { describe, expect, it } from 'vitest';
import { createPolicyEngine } from '../src/policy';

const basePolicy = {
  agent: {
    guardrails: {
      auto_send_min_confidence: 0.8,
      redact_pii: true,
      blocked_terms: ['refund']
    }
  },
  actions: {
    reply: {
      mode: 'draft_then_auto_send_if_confident'
    }
  },
  approval_matrix: [{ if: "confidence < 0.6", required_role: 'agent' }]
};

describe('Policy engine', () => {
  it('redacts PII when enabled', () => {
    const engine = createPolicyEngine(basePolicy);
    const redacted = engine.redactPII('Contact me at test@example.com or +1 555-555-5555');
    expect(redacted).not.toContain('test@example.com');
    expect(redacted).toContain('[[REDACTED]]');
  });

  it('enforces blocked terms', () => {
    const engine = createPolicyEngine(basePolicy);
    expect(() => engine.enforceBlockedTerms('Please issue refund')).toThrow();
  });

  it('decides auto send threshold', () => {
    const engine = createPolicyEngine(basePolicy);
    expect(engine.shouldAutoSend(0.85)).toBe(true);
    expect(engine.shouldAutoSend(0.5)).toBe(false);
  });

  it('requires approval per matrix', () => {
    const engine = createPolicyEngine(basePolicy);
    const shouldRequire = engine.requireApprovalFor({ type: 'reply', agent_confidence: 0.4 }, { confidence: 0.4 });
    expect(shouldRequire).toBe(true);
  });
});
