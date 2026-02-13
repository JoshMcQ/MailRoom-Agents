import { getServerSupabase } from '@/lib/supabase-server';
import { Card } from '@mailroom/ui';

export default async function MailboxesSettingsPage() {
  const supabase = getServerSupabase();
  const { data: mailboxes } = await supabase.from('mailboxes').select('id, address, provider, verified_sending');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-100">Mailboxes</h1>
        <p className="text-sm text-slate-400">Connect Gmail or Microsoft 365 inboxes.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {(mailboxes ?? []).map((mailbox) => (
          <Card key={mailbox.id} className="p-4">
            <p className="text-sm font-semibold text-slate-200">{mailbox.address}</p>
            <p className="text-xs text-slate-500">Provider: {mailbox.provider}</p>
            <p className="text-xs text-slate-500 mt-1">
              Sending verified: {mailbox.verified_sending ? 'Yes' : 'No'}
            </p>
            <div className="mt-3 flex gap-2">
              <button className="rounded-md border border-brand px-3 py-1 text-xs text-brand">
                Connect OAuth
              </button>
              <button className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300">
                Verify DKIM
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
