import { serve } from '../deps.ts';
import { getServiceClient } from '../_shared/client.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { performSendAction } from '../_shared/send_action.ts';
import { runClassificationJob, runReindexJob } from '../../../packages/llm/src/jobs.ts';
import type { Database } from '../../../packages/types/src/supabase.ts';

const noopConnectors = {
  email: { send: async () => ({ id: 'noop-email' }) },
  issues: { createIssue: async () => ({ id: 'noop-issue' }) },
  tickets: { createTicket: async () => ({ id: 'noop-ticket' }) },
  feedback: { createFeedback: async () => ({ id: 'noop-feedback' }) },
  crm: { createLead: async () => ({ id: 'noop-crm' }) },
  slack: { postMessage: async () => undefined }
};

serve(async () => {
  const supabase = getServiceClient();
  const job = await claimJob(supabase);
  if (!job) {
    return jsonResponse({ status: 'idle' });
  }

  try {
    switch (job.kind) {
      case 'classify_and_propose':
        await runClassificationJob({ supabase, connectors: noopConnectors }, job.payload);
        break;
      case 'send_action':
        await performSendAction(supabase, (job.payload as { action_id: string }).action_id);
        break;
      case 'reindex_kb':
        await runReindexJob({ supabase }, job.payload);
        break;
      default:
        throw new Error(`Unknown job kind ${job.kind}`);
    }
    await supabase
      .from('work_queue')
      .update({ done: true, locked_at: null, updated_at: new Date().toISOString() })
      .eq('id', job.id);
    return jsonResponse({ status: 'processed', job: job.kind });
  } catch (error) {
    await supabase
      .from('work_queue')
      .update({ attempts: job.attempts + 1, locked_at: null, run_at: nextRun(job.attempts) })
      .eq('id', job.id);
    return errorResponse((error as Error).message, 500);
  }
});

async function claimJob(client: import('../../deps.ts').SupabaseClient<Database>) {
  const now = new Date().toISOString();
  const { data: job } = await client
    .from('work_queue')
    .select('*')
    .lte('run_at', now)
    .eq('done', false)
    .is('locked_at', null)
    .order('run_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!job) return null;

  const { data: claimed } = await client
    .from('work_queue')
    .update({ locked_at: new Date().toISOString() })
    .eq('id', job.id)
    .is('locked_at', null)
    .select('*')
    .maybeSingle();

  return claimed ?? null;
}

function nextRun(attempts: number) {
  const delayMinutes = Math.min(60, 2 ** (attempts + 1));
  return new Date(Date.now() + delayMinutes * 60_000).toISOString();
}
