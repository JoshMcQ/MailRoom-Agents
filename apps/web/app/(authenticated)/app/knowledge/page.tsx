import { getServerSupabase } from '@/lib/supabase-server';
import { Card } from '@mailroom/ui';

export default async function KnowledgePage() {
  const supabase = getServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership) {
    return <p className="text-sm text-slate-400">No organization access.</p>;
  }

  const { data: sources } = await supabase
    .from('knowledge_sources')
    .select('id, type, url, meta')
    .eq('org_id', membership.org_id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Knowledge Base</h1>
          <p className="text-sm text-slate-400">Manage documents powering retrieval.</p>
        </div>
        <form action="/api/reindex" method="post">
          <button className="rounded-md border border-brand px-4 py-2 text-sm text-brand">Reindex</button>
        </form>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {(sources ?? []).map((source) => (
          <Card key={source.id} className="p-4">
            <p className="text-sm font-semibold text-slate-200">{source.type}</p>
            <p className="text-xs text-slate-500">{source.url}</p>
            {source.meta && (
              <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-400">{JSON.stringify(source.meta, null, 2)}</pre>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
