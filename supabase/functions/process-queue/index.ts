import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { queueId } = await req.json()

    // Fetch queue
    const { data: queue, error: queueError } = await supabaseClient
      .from('queues')
      .select('*')
      .eq('id', queueId)
      .single()

    if (queueError || !queue) {
      throw new Error('Queue not found')
    }

    // Fetch pending emails for this queue
    const { data: emails } = await supabaseClient
      .from('emails')
      .select('*, mailbox:mailboxes!inner(tenant_id)')
      .eq('mailbox.tenant_id', queue.tenant_id)
      .eq('status', 'pending')
      .order('received_at', { ascending: true })
      .limit(10)

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending emails to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const processed = []

    for (const email of emails) {
      // Auto-assign to available agent
      if (queue.assigned_agents && queue.assigned_agents.length > 0) {
        const agentId = queue.assigned_agents[0] // Simple round-robin
        
        await supabaseClient
          .from('emails')
          .update({ assigned_agent_id: agentId })
          .eq('id', email.id)

        // Create SLA tracking
        await supabaseClient
          .from('slas')
          .insert({
            queue_id: queueId,
            email_id: email.id,
            target_response_time: queue.sla_hours * 60, // Convert to minutes
            status: 'at_risk',
          })
      }

      processed.push(email.id)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processed.length,
        emailIds: processed 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
