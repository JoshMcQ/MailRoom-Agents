import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const supabase = getServerSupabase();

  await supabase.from('work_queue').insert({
    kind: 'send_action',
    payload: { action_id: params.id },
    run_at: new Date().toISOString()
  });

  return NextResponse.json({ status: 'queued' });
}
