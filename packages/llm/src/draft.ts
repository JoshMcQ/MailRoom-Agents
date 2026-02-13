import { complete } from './llm';
import { DRAFT_REPLY_PROMPT, BUGS_REPRO_EXTRACTION_PROMPT, FEEDBACK_SUMMARY_PROMPT } from './prompts';
import type { ClassificationJobContext, DraftResult } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@mailroom/types/supabase';

export async function draftReply(
  supabase: SupabaseClient<Database>,
  threadId: string,
  policySignature: string
): Promise<DraftResult> {
  const { data: thread, error: threadError } = await supabase
    .from('threads')
    .select('id, mailbox_id, subject, intent, confidence')
    .eq('id', threadId)
    .maybeSingle();
  if (threadError) throw threadError;
  if (!thread) throw new Error('Thread not found');

  const { data: messages } = await supabase
    .from('messages')
    .select('direction, text, html')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  const transcript = messages
    ?.map((message) => `${message.direction}: ${message.text ?? message.html ?? ''}`)
    .join('\n');

  const completion = await complete({
    system: DRAFT_REPLY_PROMPT,
    user: `${transcript}\n\nPolicy signature: ${policySignature}`,
    temperature: 0.4
  });

  let parsed: DraftResult;
  try {
    parsed = JSON.parse(completion.content) as DraftResult;
  } catch (error) {
    parsed = {
      html: `<p>${completion.content}</p>\n<p>${policySignature}</p>`,
      text: `${completion.content}\n\n${policySignature}`,
      citations: [],
      confidence: thread.confidence ?? 0.5
    };
  }

  return parsed;
}

export async function extractBugRepro(context: ClassificationJobContext, threadId: string) {
  const { supabase } = context;
  const { data: messages } = await supabase
    .from('messages')
    .select('text')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  const transcript = messages?.map((m) => m.text).join('\n');
  const response = await complete({ system: BUGS_REPRO_EXTRACTION_PROMPT, user: transcript ?? '' });
  try {
    return JSON.parse(response.content);
  } catch {
    return { steps: transcript, dedupe_key: `raw-${threadId}` };
  }
}

export async function summarizeFeedback(context: ClassificationJobContext, threadId: string) {
  const { supabase } = context;
  const { data: messages } = await supabase
    .from('messages')
    .select('text')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  const transcript = messages?.map((m) => m.text).join('\n');
  const response = await complete({ system: FEEDBACK_SUMMARY_PROMPT, user: transcript ?? '' });
  try {
    return JSON.parse(response.content);
  } catch {
    return { summary: transcript };
  }
}
