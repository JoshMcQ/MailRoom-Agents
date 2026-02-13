import { PolicySchema } from '../../../packages/types/src/policy.ts';
import { redactText } from '../../../packages/core/src/pii.ts';
import { sanitizeHtml } from '../../../packages/core/src/sanitize.ts';
import type { SupabaseClient } from '../deps.ts';
import type { Database } from '../../../packages/types/src/supabase.ts';

export async function performSendAction(
  supabase: SupabaseClient<Database>,
  actionId: string
): Promise<{ status: string; recipients: string[] }> {
  const { data: action } = await supabase.from('actions').select('*').eq('id', actionId).maybeSingle();
  if (!action) {
    throw new Error('action not found');
  }

  const { data: thread } = await supabase
    .from('threads')
    .select('id, mailbox_id, subject, intent, confidence')
    .eq('id', action.thread_id)
    .maybeSingle();
  if (!thread) throw new Error('thread not found');

  const { data: mailbox } = await supabase
    .from('mailboxes')
    .select('id, org_id, address')
    .eq('id', thread.mailbox_id)
    .maybeSingle();
  if (!mailbox) throw new Error('mailbox not found');

  const { data: policyRow } = await supabase
    .from('policies')
    .select('spec')
    .eq('mailbox_id', mailbox.id)
    .maybeSingle();
  const policy = PolicySchema.parse(policyRow?.spec ?? {});

  if (action.type !== 'reply') {
    await supabase
      .from('actions')
      .update({ state: 'executed', executed_at: new Date().toISOString() })
      .eq('id', action.id);
    return { status: 'skipped', recipients: [] };
  }

  const payload = action.payload as Record<string, unknown>;
  const recipients = (payload.to as string[] | undefined) ?? [];
  if (!recipients.length) {
    throw new Error('reply missing recipients');
  }

  const confidence = action.agent_confidence ?? 0;
  const autoSend =
    policy.actions.reply.mode === 'draft_then_auto_send_if_confident' &&
    confidence >= policy.agent.guardrails.auto_send_min_confidence;

  if (action.state !== 'approved' && !autoSend) {
    throw new Error('action not approved');
  }

  const redactedHtml = policy.agent.guardrails.redact_pii
    ? redactText(String(payload.draft_html ?? ''), { enabled: true })
    : String(payload.draft_html ?? '');
  const sanitizedHtml = sanitizeHtml(redactedHtml);
  const redactedText = policy.agent.guardrails.redact_pii
    ? redactText(String(payload.draft_text ?? ''), { enabled: true })
    : String(payload.draft_text ?? '');

  await supabase.from('messages').insert({
    thread_id: thread.id,
    direction: 'outbound',
    sender: mailbox.address,
    recipients,
    text: redactedText,
    html: sanitizedHtml,
    attachments: payload.attachments ?? []
  });

  await supabase
    .from('actions')
    .update({
      state: 'executed',
      executed_at: new Date().toISOString(),
      payload: { ...payload, sent_via: 'edge_stub' }
    })
    .eq('id', action.id);

  await supabase.from('events').insert({
    org_id: mailbox.org_id,
    type: 'action_executed',
    payload: { action_id: action.id, recipients }
  });

  return { status: 'sent', recipients };
}
