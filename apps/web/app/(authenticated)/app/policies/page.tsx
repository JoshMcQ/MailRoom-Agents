import { getServerSupabase } from '@/lib/supabase-server';
import { MailboxList } from '@/components/mailbox-list';

export default async function PoliciesIndexPage() {
  const supabase = getServerSupabase();
  const { data: mailboxes } = await supabase.from('mailboxes').select('id, address');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-100">Policies</h1>
        <p className="text-sm text-slate-400">Select a mailbox to edit its policy specification.</p>
      </header>
      <MailboxList mailboxes={mailboxes ?? []} />
    </div>
  );
}
