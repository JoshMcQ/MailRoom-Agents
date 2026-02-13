import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/supabase';
import { executeAction } from '@/lib/integrations/actions';

export async function POST(request: Request) {
  try {
    const { emailId, actionType, payload } = await request.json();

    if (!emailId || !actionType || !payload) {
      return NextResponse.json(
        { error: 'Email ID, action type, and payload are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Create action record
    const { data: action, error: actionError } = await supabase
      .from('actions')
      .insert({
        email_id: emailId,
        type: actionType,
        status: 'pending',
        payload,
      })
      .select()
      .single();

    if (actionError) {
      throw actionError;
    }

    // Fetch integration if needed
    let integration = null;
    if (['create_ticket', 'update_crm', 'send_slack', 'webhook'].includes(actionType)) {
      const { data: email } = await supabase
        .from('emails')
        .select('mailbox_id')
        .eq('id', emailId)
        .single();

      if (email) {
        const { data: mailbox } = await supabase
          .from('mailboxes')
          .select('tenant_id')
          .eq('id', email.mailbox_id)
          .single();

        if (mailbox) {
          const integrationTypeMap: Record<string, string> = {
            create_ticket: 'ticketing',
            update_crm: 'crm',
            send_slack: 'slack',
            webhook: 'webhook',
          };

          const { data: integrationData } = await supabase
            .from('integrations')
            .select('*')
            .eq('tenant_id', mailbox.tenant_id)
            .eq('type', integrationTypeMap[actionType])
            .eq('active', true)
            .single();

          integration = integrationData;
        }
      }
    }

    // Execute the action
    try {
      const result = await executeAction(action, integration);

      // Update action status
      await supabase
        .from('actions')
        .update({
          status: 'completed',
          result,
          completed_at: new Date().toISOString(),
        })
        .eq('id', action.id);

      return NextResponse.json({ 
        success: true, 
        action: { ...action, result } 
      });
    } catch (executeError) {
      // Update action status to failed
      await supabase
        .from('actions')
        .update({
          status: 'failed',
          result: { error: String(executeError) },
          completed_at: new Date().toISOString(),
        })
        .eq('id', action.id);

      throw executeError;
    }
  } catch (error) {
    console.error('Action execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}
