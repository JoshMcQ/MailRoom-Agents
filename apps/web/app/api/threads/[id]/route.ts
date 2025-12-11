import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('threads')
    .select('id, subject, status, intent, confidence, last_message_at, mailbox_id')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
