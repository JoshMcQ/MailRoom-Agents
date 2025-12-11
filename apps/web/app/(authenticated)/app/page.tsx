import { Suspense } from 'react';
import { QueueSummary } from '@/components/queue-summary';

export default function AppHomePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-900 bg-slate-950/60 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Live Queue</h2>
        <p className="text-sm text-slate-400">Monitor inboxes prioritized by SLA breach risk.</p>
        <div className="mt-4">
          <Suspense fallback={<p className="text-sm text-slate-500">Loading queue…</p>}>
            <QueueSummary />
          </Suspense>
        </div>
      </section>
      <section className="rounded-xl border border-slate-900 bg-slate-950/60 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Today&apos;s Highlights</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-300">
          <li>0 SLA breaches in the past hour.</li>
          <li>Feedback signals suggest strong sentiment around onboarding flow.</li>
          <li>Two bug reports escalated to GitHub with deduped issues.</li>
        </ul>
      </section>
    </div>
  );
}
