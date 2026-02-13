# Agent Integration (LangGraph / AG2)

This doc explains how to replace the current LLM job helpers with your own agent system (LangGraph, AutoGen v2/AG2, or similar) without changing the database, Edge functions, or UI.

## Current flow (what exists)
- Inbound email → `apps/functions/webhooks/inbound` → inserts message, enqueues `work_queue` job `classify_and_propose`.
- Worker (`apps/functions/worker` on Edge, or `packages/core/src/worker.ts` in Node) claims jobs and calls `packages/llm/src/jobs.ts`:
  - `runClassificationJob(context, { thread_id })` should:
    - classify intent/sentiment
    - draft a reply (HTML + text + confidence)
    - insert one or more proposed actions in `actions` table (e.g., `reply`, `create_issue`, `log_feedback`)
  - `runReindexJob(context, { org_id })` is a placeholder.
- Action execution happens via connectors (email/issues/tickets/feedback/CRM/Slack) inside `packages/core/src/actions.ts` (Node) or via the Edge `send_action` helper. Policies enforce guardrails and approval rules.

## What you can replace
You can fully replace `packages/llm` and keep everything else intact. The key is to honor the contracts below so the worker + UI continue to function.

## Contracts to implement

### 1) Classification + proposal job
Input:
- `payload: { thread_id: string }`
- `context.supabase`: typed Supabase client
- Optional: `context.connectors`, `context.logger`

Output (side effects):
- Update `threads.intent` and `threads.confidence` if you compute these.
- Insert at least one row into `actions` with `state='proposed'`.
- Recommended minimal action: a `reply` with a draft.

Required DB writes for a reply draft:
- `actions.insert({
    thread_id,
    type: 'reply',
    payload: {
      draft_html: string,
      draft_text: string,
      citations?: Array<{ source_id?: string; snippet?: string }>,
      to?: string[]  // if omitted, UI/backends can derive defaults
    },
    agent_confidence: number,
    state: 'proposed'
  })`

If intent suggests follow-ups, also insert (optional):
- `create_issue` with `{ provider, title, body, labels?, dedupe_key? }`
- `log_feedback` with `{ destination, title, body, sentiment? }`
- `create_ticket` with `{ provider, subject, body, priority?, tags? }`

Error mode:
- Throw on fatal errors; worker will backoff and retry.

### 2) Drafting contract
If you separate drafting from classification in your graph, return:
- `html: string`, `text: string`, `confidence: number`, optional `citations`.
Then persist via `actions.insert(...)` as above.

### 3) Reindex contract (optional)
Input: `payload: { org_id: string }`
- Write any status to `events` table; optionally compute embeddings and store in `kb_chunks`.

## Policy boundaries (don’t duplicate)
- Keep policy checks out of your agent graph for send-time. Policy evaluation (approval, PII redaction, blocked terms) is enforced in:
  - Node path: `packages/core/src/actions.ts` → `executeAction()`
  - Edge path: `apps/functions/_shared/send_action.ts` → `performSendAction()`
- Your agent should propose actions; let the platform enforce policy at approval/execute time.

## Work queue semantics
- Table: `work_queue`
- Kinds you’ll encounter: `'classify_and_propose' | 'send_action' | 'reindex_kb'`
- Worker grabs jobs with `locked_at is null`, `done=false`, `run_at <= now()` and uses exponential backoff on failure.
- You can add new kinds if needed, but reusing `classify_and_propose` keeps UI/flows stable.

## Minimal LangGraph/AG2 blueprint

Graph nodes:
1) LoadThread → fetch thread + recent messages from Supabase
2) Classify → intent/sentiment detection; write `threads.intent/confidence`
3) DraftReply → produce `{ html, text, confidence, citations? }`
4) ProposeActions → insert `reply` action; conditionally insert `create_issue`/`log_feedback`/`create_ticket`

Termination:
- Return void; success is observed by presence of new `actions` rows and an optional `events` log.

Pseudocode:
```ts
async function runClassificationJob(context, { thread_id }) {
  const { supabase, logger, connectors } = context;
  const thread = await loadThread(supabase, thread_id);

  const { intent, sentiment, confidence } = await classify(thread);
  await supabase.from('threads').update({ intent, confidence }).eq('id', thread_id);

  const draft = await draftReply(thread, { signature: await mailboxSignature(supabase, thread) });

  await supabase.from('actions').insert({
    thread_id,
    type: 'reply',
    payload: { draft_html: draft.html, draft_text: draft.text, citations: draft.citations, to: [thread.mailbox_address] },
    agent_confidence: draft.confidence,
    state: 'proposed'
  });

  if (intent === 'bug') {
    await supabase.from('actions').insert({
      thread_id,
      type: 'create_issue',
      payload: { provider: 'github', title: `Bug: ${draft.summary ?? 'Issue'}`, body: draft.steps ?? '...' },
      state: 'proposed'
    });
  }
}
```

## Data shapes (TypeScript references)
- `packages/types/src/actions.ts` for action payloads.
- `packages/types/src/supabase.ts` for table types.

## Where to wire your agent in
- Edge worker: `apps/functions/worker/index.ts` imports from `packages/llm/src/jobs.ts`. Replace those imports to point to your LangGraph/AG2 implementation.
- Node worker: `packages/core/src/worker.ts` imports from `@mailroom/llm`. Swap to your package if you run the Node worker.

## Error handling & retries
- Throwing in your graph will cause the worker to increment `attempts` and schedule a future retry with exponential backoff (capped at 60 minutes).
- On success, worker marks the job as `done=true`.

## Env & secrets
- OpenAI or other LLM providers: inject keys via environment variables in your package.
- Supabase creds are already supplied to Edge via service role; Node workers expect a configured client.

## Keep UI/observability intact
- Do not bypass connectors/policies when executing actions. Propose actions; let existing `executeAction()` or Edge `performSendAction()` handle sending with sanitation, approvals, and event logging.

---

With these contracts, you can swap in a LangGraph/AG2 system with zero changes to the web app or database, preserving approval flows, SLAs, and analytics.
