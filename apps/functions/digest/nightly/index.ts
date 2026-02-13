import { serve } from '../../../deps.ts';
import { getServiceClient } from '../../../_shared/client.ts';
import { jsonResponse } from '../../../_shared/response.ts';

serve(async () => {
  const supabase = getServiceClient();
  const { data: orgs } = await supabase.from('organizations').select('id, name');

  for (const org of orgs ?? []) {
    const { data: mailboxes } = await supabase.from('mailboxes').select('id').eq('org_id', org.id);
    const mailboxIds = (mailboxes ?? []).map((m) => m.id);
    if (mailboxIds.length === 0) {
      continue;
    }

    const { data: threadsForOrg } = await supabase
      .from('threads')
      .select('id, status, updated_at')
      .in('mailbox_id', mailboxIds);

    const openThreads = threadsForOrg?.filter((thread) => thread.status === 'open').length ?? 0;
    const resolvedLastDay =
      threadsForOrg?.filter(
        (thread) =>
          thread.status === 'resolved' &&
          thread.updated_at &&
          new Date(thread.updated_at).getTime() >= Date.now() - 86_400_000
      ).length ?? 0;

    const threadIds = (threadsForOrg ?? []).map((thread) => thread.id);
    let actionsCount = 0;
    if (threadIds.length) {
      const response = await supabase
        .from('actions')
        .select('id', { count: 'exact', head: true })
        .eq('state', 'executed')
        .in('thread_id', threadIds);
      actionsCount = response.count ?? 0;
    }

    await supabase.from('events').insert({
      org_id: org.id,
      type: 'digest_generated',
      payload: {
        open_threads: openThreads,
        resolved_last_24h: resolvedLastDay,
        actions_executed: actionsCount
      }
    });
  }

  return jsonResponse({ status: 'ok', processed: orgs?.length ?? 0 });
});
