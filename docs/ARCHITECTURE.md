# Mailroom Agents Architecture

## Overview
Mailroom Agents is a multi-tenant SaaS that pairs policy-controlled AI agents with shared mailboxes. The system is organised as a Turborepo monorepo:

- `apps/web`: Next.js App Router application for operators and policy editors.
- `apps/functions`: Supabase Edge Functions handling inbound email, background processing, digests, and SLA enforcement.
- `packages/core`: Action + policy engines, worker loop helpers, sanitisation utilities.
- `packages/llm`: Prompt pipelines, provider abstraction, job helpers (classification, drafting, reindexing).
- `packages/connectors`: Service integrations (email, issues, tickets, feedback, CRM, Slack) with mock fallbacks.
- `packages/types`: Shared Zod schemas and Supabase generated types.
- `packages/ui`: Reusable Tailwind / shadcn components.
- `db`: Schema, seeds, migrations.

## Data Flow
1. **Inbound email** hits `/webhooks/inbound` (Edge Function). Payloads are normalised, threads + messages are upserted, and a `classify_and_propose` job is queued.
2. **Worker** executes queued jobs. Classification uses `packages/llm` to derive intent/sentiment, proposes actions (reply drafts, bug issues, feedback logging) and logs events. `send_action` jobs run through `performSendAction` (Edge) which redacts PII, sanitises HTML, records outbound messages, and marks actions executed.
3. **Connectors** abstract third-party APIs with rate-limit-safe wrappers. In mock mode (no env keys) they emit structured results for testing.
4. **Frontend** subscribes to Supabase Realtime (`threads`, `events`) for live queue updates. Server components fetch data through `getServerSupabase`; client components use the `Providers` Supabase context and Zustand for UI state.
5. **Policies** describe tone, guardrails, routing, approval matrices, and per-action configuration. Policies are persisted per mailbox and validated with Zod before writes.

## Edge Functions
| Function | Responsibility |
| --- | --- |
| `/webhooks/inbound` | Authenticates provider webhook, normalises emails, enqueues classification |
| `/actions/send` | Uses shared policy logic to send/record replies (mock send by default) |
| `/worker` | Claims jobs with exponential backoff, runs classification, reindex, or send actions |
| `/digest/nightly` | Computes daily metrics, emits digest events |
| `/sla/check` | Detects SLA breaches, queues escalation actions |

## Database
- Postgres with `vector`, `pgcrypto`, `pg_trgm`, `citext`, `uuid-ossp` extensions.
- Strict Row Level Security via helper `in_org(uuid)` and membership-aware policies.
- `work_queue` provides at-least-once processing with `locked_at` claiming.
- Embedding columns on `messages` and `kb_chunks` prepared for pgvector search.
- `events` table is the audit trail for observability.

## Observability & Security
- Every significant state change records an `events` row.
- Outbound content is sanitised and signed with HMAC diff signatures (`OUTBOUND_DIFF_SECRET`).
- PII redaction defaults on; blocked terms trigger manual review.
- Edge functions use the Supabase service role with explicit org validation.

## Frontend
- App Router layout groups marketing vs authenticated namespaces.
- Zustand store tracks selected mailbox in the policies area.
- `lib/analytics.ts` computes First Response Time, Deflection rate, Intent mix, Bug dedupe metrics.
- API routes provide a typed layer for UI mutations (`/api/actions`, `/api/policies`, `/api/mailboxes`).

## Job Processing
`packages/core/src/worker.ts` implements claiming + exponential retry, while Edge `/worker` uses the shared `performSendAction` & LLM helpers to operate within the Deno runtime.
