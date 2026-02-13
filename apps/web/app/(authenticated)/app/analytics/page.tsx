import { getServerSupabase } from '@/lib/supabase-server';
import { getAnalyticsSummary } from '@/lib/analytics';
import { Card } from '@mailroom/ui';

export default async function AnalyticsPage() {
  const supabase = getServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership) {
    return <p className="text-sm text-slate-400">No organization access.</p>;
  }

  const summary = await getAnalyticsSummary(supabase, membership.org_id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-100">Analytics</h1>
        <p className="text-sm text-slate-400">Operational metrics updated nightly.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Avg First Response" value={`${summary.firstResponseMinutes} min`} trend="Target &lt; 30" />
        <MetricCard title="Deflection Rate" value={`${(summary.deflectionRate * 100).toFixed(0)}%`} trend="Higher is better" />
        <MetricCard title="Intents" value={Object.keys(summary.intentMix).length.toString()} trend="Unique intents" />
        <MetricCard title="Bug Dedupe" value={`${summary.bugDedupeSavings}`} trend="Issues deduped" />
      </div>
      <section>
        <h2 className="text-lg font-semibold text-slate-200">Intent Mix</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {Object.entries(summary.intentMix).map(([intent, count]) => (
            <li key={intent} className="flex items-center justify-between rounded-md border border-slate-900/60 bg-slate-950/40 p-3">
              <span className="capitalize">{intent}</span>
              <span className="font-mono">{count}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MetricCard({ title, value, trend }: { title: string; value: string; trend: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
      <p className="text-xs text-slate-500">{trend}</p>
    </Card>
  );
}
