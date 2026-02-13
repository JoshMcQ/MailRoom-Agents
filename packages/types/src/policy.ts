import { z } from 'zod';

export const PolicySchema = z.object({
  agent: z
    .object({
      tone: z.enum(['friendly_concise', 'professional', 'casual', 'technical']).default('friendly_concise'),
      signature: z.string().default('— The Team'),
      language: z.string().default('en'),
      guardrails: z
        .object({
          auto_send_min_confidence: z.number().min(0).max(1).default(0.85),
          redact_pii: z.boolean().default(true),
          blocked_terms: z.array(z.string()).default([]),
          auto_close_after_days: z.number().int().min(0).default(10)
        })
        .default({})
    })
    .default({}),
  sla: z
    .object({
      first_response_minutes: z.number().int().min(1).default(30),
      followup_hours: z.number().int().min(1).default(24)
    })
    .default({}),
  routing: z
    .object({
      escalate: z
        .object({
          conditions: z
            .array(z.object({ if: z.string(), to: z.string() }))
            .default([])
        })
        .default({}),
      assignee_rules: z
        .array(z.object({ if: z.string(), assignee: z.string() }))
        .default([])
    })
    .default({}),
  actions: z
    .object({
      reply: z
        .object({
          mode: z
            .enum(['draft_only', 'draft_then_auto_send_if_confident', 'always_require_approval'])
            .default('draft_only')
        })
        .default({}),
      create_ticket: z
        .object({
          provider: z.enum(['zendesk', 'freshdesk']).optional(),
          project: z.string().optional()
        })
        .default({}),
      create_issue: z
        .object({
          provider: z.enum(['github', 'jira', 'linear']).optional(),
          repo: z.string().optional(),
          dedupe: z.boolean().default(true)
        })
        .default({}),
      log_feedback: z
        .object({
          destination: z.enum(['notion', 'airtable', 'sheet']).optional(),
          database_id: z.string().optional()
        })
        .default({})
    })
    .default({}),
  approval_matrix: z
    .array(z.object({ if: z.string(), required_role: z.enum(['admin', 'agent']) }))
    .default([])
});

export type Policy = z.infer<typeof PolicySchema>;
