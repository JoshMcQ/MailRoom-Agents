import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@mailroom/types/supabase';

export type AnalyticsSummary = {
  firstResponseMinutes: number;
  deflectionRate: number;
  intentMix: Record<string, number>;
  bugDedupeSavings: number;
};

export async function getAnalyticsSummary(
  supabase: SupabaseClient<Database>,
  orgId: string
): Promise<AnalyticsSummary> {
  const { data: mailboxes } = await supabase.from('mailboxes').select('id').eq('org_id', orgId);
  const mailboxIds = (mailboxes ?? []).map((mailbox) => mailbox.id);
  if (mailboxIds.length === 0) {
    return { firstResponseMinutes: 0, deflectionRate: 0, intentMix: {}, bugDedupeSavings: 0 };
  }

  const { data: threads } = await supabase
    .from('threads')
    .select('id, status, intent')
    .in('mailbox_id', mailboxIds)
    .limit(100);
  const threadIds = (threads ?? []).map((thread) => thread.id);

  const { data: messages } = await supabase
    .from('messages')
    .select('thread_id, direction, created_at')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: true });

  const { data: actions } = await supabase
    .from('actions')
    .select('thread_id, type, payload')
    .in('thread_id', threadIds)
    .eq('state', 'executed');

  const firstResponseDurations: number[] = [];
  const actionsByThread = new Map<string, number>();
  for (const action of actions ?? []) {
    actionsByThread.set(action.thread_id, (actionsByThread.get(action.thread_id) ?? 0) + 1);
  }

  const bugDedupeKeys = new Set<string>();
  for (const action of actions ?? []) {
    if (action.type === 'create_issue') {
      const payload = action.payload as { dedupe_key?: string };
      if (payload?.dedupe_key) {
        bugDedupeKeys.add(payload.dedupe_key);
      }
    }
  }

  for (const thread of threads ?? []) {
    const threadMessages = (messages ?? []).filter((message) => message.thread_id === thread.id);
    const firstInbound = threadMessages.find((message) => message.direction === 'inbound');
    const firstOutbound = threadMessages.find((message) => message.direction === 'outbound');
    if (firstInbound && firstOutbound) {
      const diff =
        (new Date(firstOutbound.created_at).getTime() - new Date(firstInbound.created_at).getTime()) / 60000;
      if (diff >= 0) {
        firstResponseDurations.push(diff);
      }
    }
  }

  const firstResponseMinutes = average(firstResponseDurations);

  const resolvedThreads = (threads ?? []).filter((thread) => thread.status === 'resolved');
  const deflected = resolvedThreads.filter((thread) => (actionsByThread.get(thread.id) ?? 0) === 0);
  const deflectionRate = resolvedThreads.length
    ? Number((deflected.length / resolvedThreads.length).toFixed(2))
    : 0;

  const intentMix = countBy((threads ?? []).map((thread) => thread.intent ?? 'unknown'));
  const bugDedupeSavings = bugDedupeKeys.size;

  return {
    firstResponseMinutes,
    deflectionRate,
    intentMix,
    bugDedupeSavings
  };
}

function average(values: number[]): number {
  if (!values.length) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}
