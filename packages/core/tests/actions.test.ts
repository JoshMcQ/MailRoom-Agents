import { describe, expect, it } from 'vitest';
import { requireApprovalFor } from '../src/actions';

const policy = {
  agent: {
    tone: 'friendly_concise',
    signature: '— Test Team',
    language: 'en',
    guardrails: { auto_send_min_confidence: 0.7, redact_pii: true, blocked_terms: [], auto_close_after_days: 5 }
  },
  actions: { reply: { mode: 'draft_then_auto_send_if_confident' } },
  approval_matrix: [{ if: "intent == 'sales'", required_role: 'admin' }]
};

describe('Action helpers', () => {
  it('raises approval when below threshold', () => {
    const result = requireApprovalFor({ type: 'reply', agent_confidence: 0.5 }, { intent: 'support' } as any, policy, {
      confidence: 0.5
    });
    expect(result).toBe(true);
  });

  it('allows auto send when above threshold', () => {
    const result = requireApprovalFor({ type: 'reply', agent_confidence: 0.9 }, { intent: 'support' } as any, policy, {
      confidence: 0.9
    });
    expect(result).toBe(false);
  });

  it('requires admin for sales intent', () => {
    const result = requireApprovalFor({ type: 'reply', agent_confidence: 0.9 }, { intent: 'sales' } as any, policy, {
      intent: 'sales'
    });
    expect(result).toBe(true);
  });
});
