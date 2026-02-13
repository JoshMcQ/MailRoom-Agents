import { compileExpression } from 'filtrex';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createConnectorRegistry, type ConnectorRegistry } from '@mailroom/connectors';
import type { Database } from '@mailroom/types/supabase';
import type { ReplyPayload, CreateIssuePayload, CreateTicketPayload, LogFeedbackPayload } from '@mailroom/types/actions';
import { createPolicyEngine } from './policy';
import { sanitizeHtml } from './sanitize';

export type ActionRow = Database['public']['Tables']['actions']['Row'];
export type ThreadRow = Database['public']['Tables']['threads']['Row'];
export type MailboxRow = Database['public']['Tables']['mailboxes']['Row'];

export interface ActionContext {
  action: ActionRow;
  thread: ThreadRow;
  mailbox: MailboxRow;
  policySpec: unknown;
}

export interface ActionDeps {
  supabase: SupabaseClient<Database>;
  connectors?: ConnectorRegistry;
  logger?: { info: (msg: string, meta?: Record<string, unknown>) => void; error: (msg: string, meta?: Record<string, unknown>) => void };
}

const defaultLogger = {
  info: (message: string, meta?: Record<string, unknown>) => console.log(message, meta ?? {}),
  error: (message: string, meta?: Record<string, unknown>) => console.error(message, meta ?? {})
};

async function loadActionContext(client: SupabaseClient<Database>, actionId: string): Promise<ActionContext> {
  const { data: action, error: actionError } = await client
    .from('actions')
    .select('*')
    .eq('id', actionId)
    .maybeSingle();
  if (actionError) throw actionError;
  if (!action) throw new Error('Action not found');

  const { data: thread, error: threadError } = await client
    .from('threads')
    .select('*')
    .eq('id', action.thread_id)
    .maybeSingle();
  if (threadError) throw threadError;
  if (!thread) throw new Error('Thread not found for action');

  const { data: mailbox, error: mailboxError } = await client
    .from('mailboxes')
    .select('*')
    .eq('id', thread.mailbox_id)
    .maybeSingle();
  if (mailboxError) throw mailboxError;
  if (!mailbox) throw new Error('Mailbox not found for action');

  const { data: policyRow } = await client
    .from('policies')
    .select('spec')
    .eq('mailbox_id', mailbox.id)
    .maybeSingle();

  return { action, thread, mailbox, policySpec: policyRow?.spec ?? {} };
}

export async function proposeAction(
  client: SupabaseClient<Database>,
  type: ActionRow['type'],
  payload: Record<string, unknown>,
  threadId: string,
  confidence?: number | null
): Promise<ActionRow> {
  const { data, error } = await client
    .from('actions')
    .insert({
      thread_id: threadId,
      type,
      payload,
      agent_confidence: confidence ?? null,
      state: 'proposed'
    })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Failed to create action');
  return data;
}

export async function approveAction(
  deps: ActionDeps,
  actionId: string,
  approverId: string,
  note?: string
): Promise<ActionRow> {
  const logger = deps.logger ?? defaultLogger;
  const { action, thread, mailbox, policySpec } = await loadActionContext(deps.supabase, actionId);
  if (action.state !== 'proposed') {
    return action;
  }

  const { data: membership, error: memberError } = await deps.supabase
    .from('org_members')
    .select('role')
    .eq('org_id', mailbox.org_id)
    .eq('user_id', approverId)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!membership) throw new Error('Approver is not a member of the organization');

  const policyEngine = createPolicyEngine(policySpec);
  const context = {
    intent: thread.intent,
    confidence: action.agent_confidence,
    actionType: action.type
  };

  const requiresApproval = policyEngine.requireApprovalFor(action, context);

  if (!requiresApproval) {
    logger.info('Action did not require approval per policy, auto-approving', { actionId });
  }

  const requiredRoles = new Set<string>();
  for (const rule of policyEngine.policy.approval_matrix) {
    try {
      const evaluate = compileExpression(rule.if);
      if (evaluate(context)) {
        requiredRoles.add(rule.required_role);
      }
    } catch (error) {
      logger.error('Failed to evaluate approval rule', { error: String(error), rule });
    }
  }

  if (requiredRoles.has('admin') && membership.role !== 'admin') {
    throw new Error('Action requires admin approval');
  }
  if (requiredRoles.has('agent') && membership.role === 'viewer') {
    throw new Error('Action requires agent approval');
  }

  const { data: updated, error: updateError } = await deps.supabase
    .from('actions')
    .update({ state: 'approved', updated_at: new Date().toISOString() })
    .eq('id', actionId)
    .select('*')
    .maybeSingle();
  if (updateError) throw updateError;
  if (!updated) throw new Error('Failed to update action state');

  await deps.supabase.from('approvals').insert({
    action_id: actionId,
    approver_user_id: approverId,
    status: 'approved',
    note,
    decided_at: new Date().toISOString()
  });

  await deps.supabase.from('events').insert({
    org_id: mailbox.org_id,
    type: 'action_approved',
    payload: { action_id: actionId, approver_id: approverId }
  });

  return updated;
}

export async function executeAction(deps: ActionDeps, actionId: string): Promise<ActionRow> {
  const logger = deps.logger ?? defaultLogger;
  const { supabase } = deps;
  const connectors = deps.connectors ?? createConnectorRegistry({ logger });
  const { action, thread, mailbox, policySpec } = await loadActionContext(supabase, actionId);
  const policyEngine = createPolicyEngine(policySpec);

  if (action.state !== 'approved' && !policyEngine.shouldAutoSend(action.agent_confidence ?? null)) {
    throw new Error('Action must be approved before execution');
  }

  let result: unknown;

  try {
    switch (action.type) {
      case 'reply': {
        const payload = action.payload as ReplyPayload;
        policyEngine.enforceBlockedTerms(payload.draft_text + payload.draft_html);
        const sanitizedHtml = policyEngine.redactPII(sanitizeHtml(payload.draft_html));
        const sanitizedText = policyEngine.redactPII(payload.draft_text);
        const to = payload.to ?? [];
        if (to.length === 0) {
          throw new Error('Reply payload missing recipients');
        }
        const sendResult = await connectors.email.send({
          from: mailbox.address,
          to,
          cc: payload.cc ?? [],
          subject: payload.subject ?? thread.subject ?? 'Re: support request',
          html: sanitizedHtml,
          text: sanitizedText,
          attachments: payload.attachments
        });
        result = sendResult;
        await supabase.from('messages').insert({
          thread_id: thread.id,
          direction: 'outbound',
          sender: mailbox.address,
          recipients: JSON.parse(JSON.stringify(to)),
          text: sanitizedText,
          html: sanitizedHtml,
          attachments: JSON.parse(JSON.stringify(payload.attachments ?? []))
        });
        break;
      }
      case 'create_issue': {
        result = await connectors.issues.createIssue(action.payload as CreateIssuePayload);
        break;
      }
      case 'create_ticket': {
        result = await connectors.tickets.createTicket(action.payload as CreateTicketPayload);
        break;
      }
      case 'log_feedback': {
        result = await connectors.feedback.createFeedback(action.payload as LogFeedbackPayload);
        break;
      }
      case 'create_crm_lead': {
        result = await connectors.crm.createLead(action.payload);
        break;
      }
      case 'escalate': {
        await connectors.slack.postMessage('#support-escalations', action.payload);
        result = { id: 'slack-escalation' };
        break;
      }
      default:
        throw new Error(`Unhandled action type ${action.type}`);
    }
  } catch (error) {
    logger.error('Action execution failed', { error: String(error), actionId });
    await supabase
      .from('actions')
      .update({ state: 'failed', updated_at: new Date().toISOString() })
      .eq('id', actionId);
    await supabase.from('events').insert({
      org_id: mailbox.org_id,
      type: 'action_failed',
      payload: { action_id: actionId, error: String(error) }
    });
    throw error;
  }

  const executedAt = new Date().toISOString();
  const diffSignatureSecret = process.env.OUTBOUND_DIFF_SECRET;
  let diffSignature: string | undefined;
  if (diffSignatureSecret && action.type === 'reply') {
    const payload = action.payload as ReplyPayload;
    diffSignature = await signWithSecret(diffSignatureSecret, `${payload.draft_html ?? ''}${payload.draft_text ?? ''}`);
  }

  const { data: updated, error: updateError } = await supabase
    .from('actions')
    .update({
      state: 'executed',
      executed_at: executedAt,
      payload: { ...action.payload, result, diffSignature }
    })
    .eq('id', actionId)
    .select('*')
    .maybeSingle();
  if (updateError) throw updateError;
  if (!updated) throw new Error('Failed to mark action executed');

  await supabase.from('events').insert({
    org_id: mailbox.org_id,
    type: 'action_executed',
    payload: { action_id: actionId, result }
  });

  return updated;
}

export function requireApprovalFor(
  action: { type: string; agent_confidence?: number | null },
  thread: ThreadRow,
  policySpec: unknown,
  context: Record<string, unknown> = {}
): boolean {
  const engine = createPolicyEngine(policySpec);
  return engine.requireApprovalFor(action, {
    intent: thread.intent,
    confidence: action.agent_confidence,
    ...context
  });
}

async function signWithSecret(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
