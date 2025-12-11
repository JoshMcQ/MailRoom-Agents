import { PolicySchema } from '@mailroom/types/policy';
import type { ClassificationJobContext, ReindexJobContext } from './types';
import { classifyThread } from './classification';
import { draftReply, extractBugRepro, summarizeFeedback } from './draft';

export async function runClassificationJob(
  context: ClassificationJobContext,
  payload: unknown
): Promise<void> {
  const { supabase, logger } = context;
  const threadId = (payload as { thread_id?: string })?.thread_id;
  if (!threadId) throw new Error('Missing thread_id in job payload');

  const classification = await classifyThread(context, threadId);

  const { data: thread } = await supabase
    .from('threads')
    .select('id, mailbox_id, intent, confidence')
    .eq('id', threadId)
    .maybeSingle();
  if (!thread) return;

  const { data: mailbox } = await supabase
    .from('mailboxes')
    .select('id, org_id, address')
    .eq('id', thread.mailbox_id)
    .maybeSingle();
  if (!mailbox) return;

  const { data: policyRow } = await supabase
    .from('policies')
    .select('spec')
    .eq('mailbox_id', mailbox.id)
    .maybeSingle();
  const policy = PolicySchema.parse(policyRow?.spec ?? {});

  const draft = await draftReply(supabase, threadId, policy.agent.signature);

  await supabase.from('actions').insert({
    thread_id: threadId,
    type: 'reply',
    payload: {
      draft_html: draft.html,
      draft_text: draft.text,
      citations: draft.citations,
      confidence: draft.confidence,
      to: [mailbox.address]
    },
    agent_confidence: draft.confidence,
    state: 'proposed'
  });

  if (classification.intent === 'bug') {
    const repro = await extractBugRepro(context, threadId);
    await supabase.from('actions').insert({
      thread_id: threadId,
      type: 'create_issue',
      payload: {
        provider: policy.actions.create_issue.provider ?? 'github',
        title: `Bug: ${repro.summary ?? 'Issue reported'}`,
        body: repro.steps ?? 'Steps unavailable',
        labels: ['bug'],
        dedupe_key: repro.dedupe_key
      },
      state: 'proposed'
    });
  }

  if (classification.intent === 'feedback') {
    const summary = await summarizeFeedback(context, threadId);
    await supabase.from('actions').insert({
      thread_id: threadId,
      type: 'log_feedback',
      payload: {
        destination: policy.actions.log_feedback.destination ?? 'notion',
        title: `Feedback from thread ${threadId.slice(0, 8)}`,
        body: summary.summary ?? 'See thread for details',
        sentiment: classification.sentiment
      },
      state: 'proposed'
    });
  }

  logger?.info?.('Classification job finished', { threadId, classification });
}

export async function runReindexJob(context: ReindexJobContext, payload: unknown): Promise<void> {
  const { supabase, logger } = context;
  const orgId = (payload as { org_id?: string })?.org_id;
  if (!orgId) throw new Error('Missing org_id for reindex job');

  const { data: sources, error } = await supabase
    .from('knowledge_sources')
    .select('id, org_id, url');
  if (error) throw error;

  logger?.info?.('Reindexing knowledge base', { orgId, sources: sources?.length ?? 0 });

  // Placeholder: mark run in events table
  await supabase.from('events').insert({
    org_id: orgId,
    type: 'knowledge_reindex_triggered',
    payload: { sources: sources?.map((s) => s.id) }
  });
}
