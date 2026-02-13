import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase-server';

const schema = z.object({
  address: z.string().email(),
  provider: z.enum(['gmail', 'ms365', 'imap', 'mock']).default('mock')
});

export async function POST(request: NextRequest) {
  const supabase = getServerSupabase();
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('mailboxes')
    .insert({
      org_id: membership.org_id,
      address: parsed.data.address,
      provider: parsed.data.provider
    })
    .select('id, address, provider')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
