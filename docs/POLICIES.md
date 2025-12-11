# Policy Specification

Policies govern each mailbox agent via `packages/types/policy.ts` (Zod schema). Key sections:

- `agent`: tone, signature, language, guardrails (PII redaction, auto-send threshold, banned phrases).
- `sla`: `first_response_minutes`, `followup_hours` drive SLA checks.
- `routing`: escalation conditions (Filtrex expressions) and assignee rules.
- `actions`: per-action configuration; enables external providers and dedupe settings.
- `approval_matrix`: additional Filtrex expressions mapping to required roles (`admin` or `agent`).

## Evaluation Flow
1. Policy spec is validated when saved (UI or API).
2. `createPolicyEngine` normalises defaults and exposes:
   - `shouldAutoSend(confidence)`
   - `redactPII(content)`
   - `enforceBlockedTerms(content)`
   - `computeRouting(intent, sentiment)`
   - `requireApprovalFor(action, context)`
3. Edge `/actions/send` and the LLM worker rely on identical enforcement helpers.

## Sample Policies
Seed policies located at `apps/web/seed/policies/` illustrate recommended defaults for `support@`, `hello@`, `bugs@`, and `feedback@`. Each emphasises different guardrails:
- **support**: auto-send above 0.88 confidence, security escalations to `#tier2-security`.
- **hello**: always requires approval, blocks pricing language.
- **bugs**: technical tone, GitHub dedupe on `dedupe_key`.
- **feedback**: logs to Notion, escalates negative sentiment to Slack.
