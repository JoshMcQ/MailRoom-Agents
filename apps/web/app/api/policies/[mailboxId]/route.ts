import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase-server';
import { PolicySchema } from '@mailroom/types/policy';

const schema = z.object({ spec: z.any() });

export async function PUT(request: NextRequest, { params }: { params: { mailboxId: string } }) {
  const supabase = getServerSupabase();
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  const validated = PolicySchema.parse(parsed.data.spec);

  const { error } = await supabase
    .from('policies')
    .upsert({ mailbox_id: params.mailboxId, spec: validated })
    .eq('mailbox_id', params.mailboxId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ status: 'ok' });
}
