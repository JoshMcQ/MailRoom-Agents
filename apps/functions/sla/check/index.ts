import { serve } from '../../deps.ts';
import { getServiceClient } from '../../_shared/client.ts';
import { jsonResponse } from '../../_shared/response.ts';
import { PolicySchema } from '../../../../packages/types/src/policy.ts';

serve(async () => {
  const supabase = getServiceClient();
  const { data: threads } = await supabase
    .from('threads')
    .select('id, mailbox_id, status, last_message_at')
    .in('status', ['open', 'pending']);

  const breaches: string[] = [];

  for (const thread of threads ?? []) {
    const { data: policyRow } = await supabase
      .from('policies')
      .select('spec')
      .eq('mailbox_id', thread.mailbox_id)
      .maybeSingle();
    const policy = PolicySchema.parse(policyRow?.spec ?? {});

    const lastMessageAt = thread.last_message_at ? new Date(thread.last_message_at) : null;
    const minutesSinceLastMessage = lastMessageAt
      ? (Date.now() - lastMessageAt.getTime()) / 60000
      : Number.POSITIVE_INFINITY;

    if (minutesSinceLastMessage > policy.sla.first_response_minutes) {
      breaches.push(thread.id);
      await supabase.from('actions').insert({
        thread_id: thread.id,
        type: 'escalate',
        payload: {
          reason: 'FIRST_RESPONSE_BREACH',
          minutes_waiting: Math.round(minutesSinceLastMessage)
        },
        state: 'proposed'
      });
    }
  }

  return jsonResponse({ status: 'ok', breaches });
});
