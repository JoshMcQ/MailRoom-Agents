import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';
import { Badge } from '@mailroom/ui';

export default async function QueuePage() {
  const supabase = getServerSupabase();
  const { data: threads } = await supabase
    .from('threads')
    .select('id, subject, status, intent, confidence, last_message_at, mailbox_id')
    .order('last_message_at', { ascending: false })
    .limit(50);

  const { data: mailboxes } = await supabase.from('mailboxes').select('id, address');
  const mailboxMap = new Map(mailboxes?.map((mailbox) => [mailbox.id, mailbox.address]));

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Realtime Queue</h1>
          <p className="text-sm text-slate-400">Prioritized by last update and confidence.</p>
        </div>
        <Badge tone="warning">Beta</Badge>
      </header>
      <table className="min-w-full overflow-hidden rounded-xl border border-slate-900/80">
        <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3">Mailbox</th>
            <th className="px-4 py-3">Subject</th>
            <th className="px-4 py-3">Intent</th>
            <th className="px-4 py-3">Confidence</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900/80 text-sm">
          {(threads ?? []).map((thread) => (
            <tr key={thread.id} className="bg-slate-950/40 hover:bg-slate-900/40">
              <td className="px-4 py-3 text-slate-300">{mailboxMap.get(thread.mailbox_id)}</td>
              <td className="px-4 py-3">
                <Link href={`/app/thread/${thread.id}`} className="text-slate-100 hover:underline">
                  {thread.subject ?? 'No subject'}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-400">{thread.intent ?? 'unclassified'}</td>
              <td className="px-4 py-3 font-mono text-slate-200">
                {(thread.confidence ?? 0).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-slate-400">
                {thread.last_message_at ? new Date(thread.last_message_at).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3">
                <Badge tone={thread.status === 'open' ? 'warning' : 'default'}>{thread.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
