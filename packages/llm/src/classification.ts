import { complete } from './llm';
import { CLASSIFY_PROMPT } from './prompts';
import type { ClassificationResult, ClassificationJobContext } from './types';

export async function classifyThread(
  context: ClassificationJobContext,
  threadId: string
): Promise<ClassificationResult> {
  const { supabase, logger } = context;
  const { data: thread, error: threadError } = await supabase
    .from('threads')
    .select('id, mailbox_id, intent, confidence')
    .eq('id', threadId)
    .maybeSingle();
  if (threadError) throw threadError;
  if (!thread) {
    throw new Error(`Thread ${threadId} not found`);
  }

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('direction, text, html, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(5);
  if (messagesError) throw messagesError;

  const serialized = messages
    ?.map((message) => `${message.direction} @ ${message.created_at}: ${message.text ?? message.html ?? ''}`)
    .join('\n');

  const response = await complete({
    system: CLASSIFY_PROMPT,
    user: serialized ?? 'No messages.'
  });

  let parsed: ClassificationResult;
  try {
    parsed = JSON.parse(response.content) as ClassificationResult;
  } catch (error) {
    logger?.error?.('Failed to parse classification response', { response: response.content });
    parsed = { intent: 'other', sentiment: 'neu', urgency: 'low', entities: [], confidence: 0.2 };
  }

  await supabase
    .from('threads')
    .update({ intent: parsed.intent, confidence: parsed.confidence })
    .eq('id', threadId);

  await supabase.from('events').insert({
    org_id: (await mailboxOrgId(supabase, thread.mailbox_id))!,
    type: 'thread_classified',
    payload: { thread_id: threadId, classification: parsed }
  });

  return parsed;
}

async function mailboxOrgId(
  client: import('@supabase/supabase-js').SupabaseClient<import('@mailroom/types/supabase').Database>,
  mailboxId: string
): Promise<string | undefined> {
  const { data } = await client.from('mailboxes').select('org_id').eq('id', mailboxId).maybeSingle();
  if (!data?.org_id) {
    throw new Error(`Mailbox ${mailboxId} missing org`);
  }
  return data.org_id;
}
