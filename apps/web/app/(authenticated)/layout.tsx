import { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSupabase } from '../../lib/supabase-server';

const NAV_ITEMS = [
  { href: '/app', label: 'Dashboard' },
  { href: '/app/queue', label: 'Queue' },
  { href: '/app/approvals', label: 'Approvals' },
  { href: '/app/analytics', label: 'Analytics' },
  { href: '/app/policies', label: 'Policies' },
  { href: '/app/knowledge', label: 'Knowledge' },
  { href: '/app/settings/mailboxes', label: 'Settings' }
];

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const supabase = getServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <aside className="hidden w-72 flex-col border-r border-slate-900 bg-slate-950/70 p-6 lg:flex">
        <Link href="/app" className="mb-8 inline-flex items-center gap-2 text-lg font-semibold">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-light" />
          Mailroom Agents
        </Link>
        <nav className="flex flex-1 flex-col gap-2 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-slate-300 transition hover:bg-slate-900 hover:text-slate-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-slate-900 bg-slate-950/50 px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-200">Operator Console</h1>
          <p className="text-xs text-slate-500">
            Manage queues, approvals, analytics, and policies across every mailbox.
          </p>
        </div>
        <div className="px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
