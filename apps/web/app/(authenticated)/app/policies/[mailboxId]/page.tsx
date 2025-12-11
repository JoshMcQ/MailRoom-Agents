import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase-server';
import { PolicySchema } from '@mailroom/types/policy';
import { PolicyEditor } from '@/components/policy-editor';

export default async function PolicyPage({ params }: { params: { mailboxId: string } }) {
  const supabase = getServerSupabase();
  const { data: mailbox } = await supabase
    .from('mailboxes')
    .select('id, org_id, address')
    .eq('id', params.mailboxId)
    .maybeSingle();
  if (!mailbox) redirect('/app/policies');

  const { data: policyRow } = await supabase
    .from('policies')
    .select('spec')
    .eq('mailbox_id', mailbox.id)
    .maybeSingle();

  async function savePolicy(value: string) {
    'use server';
    const supabaseServer = getServerSupabase();
    const parsed = PolicySchema.parse(JSON.parse(value));
    await supabaseServer
      .from('policies')
      .upsert({ mailbox_id: mailbox.id, spec: parsed })
      .eq('mailbox_id', mailbox.id);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Policy for {mailbox.address}</h1>
        <p className="text-sm text-slate-400">Edit guardrails, approvals, routing, and action modes.</p>
      </div>
      <PolicyEditor
        defaultValue={JSON.stringify(policyRow?.spec ?? PolicySchema.parse({}), null, 2)}
        onSave={savePolicy}
      />
    </div>
  );
}
