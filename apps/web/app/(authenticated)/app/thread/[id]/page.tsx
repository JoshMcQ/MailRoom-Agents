import { notFound } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase-server';
import { Badge, Card } from '@mailroom/ui';

export default async function ThreadDetail({ params }: { params: { id: string } }) {
  const supabase = getServerSupabase();
  const { data: thread } = await supabase
    .from('threads')
    .select('id, subject, status, intent, confidence, mailbox_id')
    .eq('id', params.id)
    .maybeSingle();
  if (!thread) notFound();

  const { data: messages } = await supabase
    .from('messages')
    .select('id, direction, sender, text, html, created_at')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true });

  const { data: actions } = await supabase
    .from('actions')
    .select('id, type, state, agent_confidence, payload, created_at, updated_at')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: false });

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">{thread.subject ?? 'No subject'}</h1>
            <p className="text-sm text-slate-400">Intent: {thread.intent ?? 'unclassified'}</p>
          </div>
          <Badge tone={thread.status === 'open' ? 'warning' : 'default'}>{thread.status}</Badge>
        </header>
        <div className="space-y-4">
          {(messages ?? []).map((message) => (
            <Card key={message.id} className="p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                <span>{message.direction}</span>
                <span>{new Date(message.created_at).toLocaleString()}</span>
              </div>
              <div className="mt-2 text-sm text-slate-200">
                {message.html ? (
                  <div dangerouslySetInnerHTML={{ __html: message.html }} />
                ) : (
                  <p>{message.text}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>
      <aside className="space-y-4">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-200">AI Draft</h2>
          <p className="mt-2 text-xs text-slate-400">
            Most recent suggestion from the agent will appear here after classification.
          </p>
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-200">Actions</h2>
          <div className="mt-3 space-y-2 text-sm">
            {(actions ?? []).map((action) => (
              <div key={action.id} className="rounded-md border border-slate-900/60 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                  <span>{action.type}</span>
                  <Badge tone={action.state === 'proposed' ? 'warning' : 'success'}>{action.state}</Badge>
                </div>
                {action.agent_confidence != null && (
                  <p className="mt-2 text-xs text-slate-400">
                    Confidence {(action.agent_confidence * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
