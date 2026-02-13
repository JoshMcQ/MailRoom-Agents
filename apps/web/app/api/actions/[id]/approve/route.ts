import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const supabase = getServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: action } = await supabase.from('actions').select('id, thread_id, state').eq('id', params.id).maybeSingle();
  if (!action) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  await supabase
    .from('actions')
    .update({ state: 'approved', updated_at: new Date().toISOString() })
    .eq('id', action.id);

  await supabase.from('approvals').insert({
    action_id: action.id,
    approver_user_id: user.id,
    status: 'approved',
    decided_at: new Date().toISOString()
  });

  return NextResponse.json({ status: 'ok' });
}
