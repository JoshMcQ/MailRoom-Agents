import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = getServerSupabase();
  const { searchParams } = request.nextUrl;
  const mailboxId = searchParams.get('mailbox_id');
  const status = searchParams.get('status');
  const q = searchParams.get('q');

  let query = supabase.from('threads').select('id, subject, status, intent, confidence, last_message_at, mailbox_id');
  if (mailboxId) query = query.eq('mailbox_id', mailboxId);
  if (status) query = query.eq('status', status);
  if (q) query = query.ilike('subject', `%${q}%`);

  const { data, error } = await query.order('last_message_at', { ascending: false }).limit(50);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
