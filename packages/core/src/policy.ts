import { compileExpression } from 'filtrex';
import type { Policy } from '@mailroom/types/policy';
import { PolicySchema } from '@mailroom/types/policy';
import { containsBlockedTerm, redactText } from './pii';

export type PolicyEngine = ReturnType<typeof createPolicyEngine>;

export interface RoutingDecision {
  escalateTo?: string[];
  assignee?: string | null;
}

export function createPolicyEngine(spec: unknown) {
  const policy = PolicySchema.parse(spec ?? {});

  function shouldAutoSend(confidence: number | null | undefined): boolean {
    if (confidence == null) return false;
    const mode = policy.actions.reply.mode;
    if (mode === 'always_require_approval') return false;
    if (mode === 'draft_only') return false;
    const threshold = policy.agent.guardrails.auto_send_min_confidence;
    return confidence >= threshold;
  }

  function redactPII(input: string): string {
    if (!policy.agent.guardrails.redact_pii) {
      return input;
    }

    return redactText(input, { enabled: true });
  }

  function enforceBlockedTerms(input: string): void {
    const match = containsBlockedTerm(input, policy.agent.guardrails.blocked_terms);
    if (match) {
      throw new Error(`Blocked term detected: ${match}`);
    }
  }

  function computeRouting(intent: string | null, sentiment: string | null): RoutingDecision {
    const decision: RoutingDecision = { assignee: null, escalateTo: [] };

    const context = {
      intent: intent ?? 'unknown',
      sentiment: sentiment ?? 'neutral'
    };

    const escalateConditions = policy.routing.escalate.conditions;
    for (const condition of escalateConditions) {
      const evaluate = compileExpression(condition.if);
      if (evaluate(context)) {
        decision.escalateTo = [...(decision.escalateTo ?? []), condition.to];
      }
    }

    for (const rule of policy.routing.assignee_rules) {
      const evaluate = compileExpression(rule.if);
      if (evaluate(context)) {
        decision.assignee = rule.assignee;
        break;
      }
    }

    return decision;
  }

  function requireApprovalFor(action: { type: string; agent_confidence?: number | null }, context: Record<string, unknown>): boolean {
    if (action.type === 'reply') {
      if (policy.actions.reply.mode === 'always_require_approval' || policy.actions.reply.mode === 'draft_only') {
        return true;
      }
      if (!shouldAutoSend(action.agent_confidence ?? null)) {
        return true;
      }
    }

    for (const matrix of policy.approval_matrix) {
      const evaluate = compileExpression(matrix.if);
      if (evaluate({ ...context, actionType: action.type })) {
        return true;
      }
    }

    return false;
  }

  return {
    policy,
    shouldAutoSend,
    redactPII,
    enforceBlockedTerms,
    computeRouting,
    requireApprovalFor
  };
}

export function normalizePolicy(spec: unknown): Policy {
  return PolicySchema.parse(spec ?? {});
}
