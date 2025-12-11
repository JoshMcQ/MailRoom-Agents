import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';
import { Badge, Card } from '@mailroom/ui';

export default async function ApprovalsPage() {
  const supabase = getServerSupabase();
  const { data: actions } = await supabase
    .from('actions')
    .select('id, thread_id, type, state, agent_confidence, created_at')
    .eq('state', 'proposed')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-100">Pending Approvals</h1>
        <p className="text-sm text-slate-400">Actions awaiting review before execution.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {(actions ?? []).map((action) => (
          <Card key={action.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">{action.type}</p>
                <p className="text-xs text-slate-500">Created {new Date(action.created_at).toLocaleString()}</p>
              </div>
              <Badge tone="warning">{action.state}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span>Confidence {(action.agent_confidence ?? 0) * 100}%</span>
              <Link
                href={`/app/thread/${action.thread_id}`}
                className="text-brand-light hover:text-brand"
              >
                View Thread
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
