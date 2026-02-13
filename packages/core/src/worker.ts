import type { SupabaseClient } from '@supabase/supabase-js';
import { executeAction } from './actions';
import type { Database } from '@mailroom/types/supabase';
import type { ActionDeps } from './actions';
import { createConnectorRegistry } from '@mailroom/connectors';
import { runClassificationJob, runReindexJob } from '@mailroom/llm';

export interface WorkerDeps extends ActionDeps {
  supabase: SupabaseClient<Database>;
}

export interface WorkQueueItem extends Database['public']['Tables']['work_queue']['Row'] {}

async function claimJob(client: SupabaseClient<Database>): Promise<WorkQueueItem | null> {
  const nowIso = new Date().toISOString();
  const { data: job, error } = await client
    .from('work_queue')
    .select('*')
    .lte('run_at', nowIso)
    .eq('done', false)
    .is('locked_at', null)
    .order('run_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
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

async function markJob(
  client: SupabaseClient<Database>,
  jobId: number,
  updates: Partial<Database['public']['Tables']['work_queue']['Row']>
) {
  await client.from('work_queue').update(updates).eq('id', jobId);
}

export async function processNextJob(deps: WorkerDeps): Promise<boolean> {
  const connectors = deps.connectors ?? createConnectorRegistry({ logger: deps.logger });
  const job = await claimJob(deps.supabase);
  if (!job) return false;

  try {
    switch (job.kind) {
      case 'classify_and_propose':
        await runClassificationJob({ supabase: deps.supabase, connectors, logger: deps.logger }, job.payload);
        break;
      case 'send_action':
        await executeAction({ ...deps, connectors }, (job.payload as { action_id: string }).action_id);
        break;
      case 'reindex_kb':
        await runReindexJob({ supabase: deps.supabase, logger: deps.logger }, job.payload);
        break;
      default:
        throw new Error(`Unknown job kind ${job.kind}`);
    }
    await markJob(deps.supabase, job.id, { done: true, locked_at: null, updated_at: new Date().toISOString() });
    return true;
  } catch (error) {
    const attempts = job.attempts + 1;
    const backoffMinutes = Math.min(60, 2 ** attempts);
    await markJob(deps.supabase, job.id, {
      attempts,
      locked_at: null,
      run_at: new Date(Date.now() + backoffMinutes * 60_000).toISOString(),
      updated_at: new Date().toISOString()
    });
    if (deps.logger) {
      deps.logger.error('Job processing failed', { job, error: String(error) });
    }
    return false;
  }
}
