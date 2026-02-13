import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = getServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  await supabase.from('work_queue').insert({
    kind: 'reindex_kb',
    payload: { org_id: membership.org_id },
    run_at: new Date().toISOString()
  });

  return NextResponse.json({ status: 'queued' });
}
