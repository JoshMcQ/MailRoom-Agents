import { serve, z } from '../../deps.ts';
import { getServiceClient } from '../../_shared/client.ts';
import { errorResponse, jsonResponse } from '../../_shared/response.ts';

const inboundSchema = z.object({
  to: z.array(z.string().email()).min(1),
  from: z.string().email(),
  subject: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  provider_ids: z.record(z.string()).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url()
      })
    )
    .optional()
});

function verifySecret(request: Request): boolean {
  const secret = Deno.env.get('WEBHOOK_SECRET');
  if (!secret) return true;
  const header = request.headers.get('x-webhook-secret');
  return header === secret;
}

serve(async (request) => {
  if (!verifySecret(request)) {
    return errorResponse('invalid signature', 401);
  }

  const body = await request.json().catch(() => null);
  const payload = inboundSchema.safeParse(body);
  if (!payload.success) {
    return errorResponse('invalid payload', 400);
  }

  const supabase = getServiceClient();
  const [primaryRecipient] = payload.data.to;

  const { data: mailbox } = await supabase
    .from('mailboxes')
    .select('id, org_id, address')
    .eq('address', primaryRecipient.toLowerCase())
    .maybeSingle();
  if (!mailbox) {
    return errorResponse('mailbox not found', 404);
  }

  const subject = payload.data.subject ?? '(no subject)';

  const { data: thread } = await supabase
    .from('threads')
    .select('id')
    .eq('mailbox_id', mailbox.id)
    .eq('subject', subject)
    .maybeSingle();

  const threadId = thread?.id ?? (await createThread(supabase, mailbox.id, subject)).id;

  await supabase.from('messages').insert({
    thread_id: threadId,
    direction: 'inbound',
    sender: payload.data.from,
    recipients: payload.data.to,
    text: payload.data.text,
    html: payload.data.html,
    attachments: payload.data.attachments ?? []
  });

  await supabase.from('events').insert({
    org_id: mailbox.org_id,
    type: 'message_ingested',
    payload: { thread_id: threadId }
  });

  await supabase.from('work_queue').insert({
    kind: 'classify_and_propose',
    payload: { thread_id: threadId },
    run_at: new Date().toISOString()
  });

  return jsonResponse({ status: 'ok', thread_id: threadId });
});

async function createThread(
  supabase: ReturnType<typeof getServiceClient>,
  mailboxId: string,
  subject: string
) {
  const { data, error } = await supabase
    .from('threads')
    .insert({ mailbox_id: mailboxId, subject })
    .select('id')
    .maybeSingle();
  if (error || !data) {
    throw error ?? new Error('failed to create thread');
  }
  return data;
}
