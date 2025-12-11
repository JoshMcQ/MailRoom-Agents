import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { mailboxId, from, to, cc, subject, body, htmlBody } = await req.json()

    // Validate required fields
    if (!mailboxId || !from || !to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Create email record
    const { data: email, error: emailError } = await supabaseClient
      .from('emails')
      .insert({
        mailbox_id: mailboxId,
        from_address: from,
        to_addresses: Array.isArray(to) ? to : [to],
        cc_addresses: cc ? (Array.isArray(cc) ? cc : [cc]) : [],
        subject,
        body,
        html_body: htmlBody,
        received_at: new Date().toISOString(),
        status: 'pending',
      })
      .select()
      .single()

    if (emailError) {
      throw emailError
    }

    // Trigger classification (would be done async in production)
    // This would trigger a webhook or background job to classify the email
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: email.id,
        message: 'Email processed successfully' 
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
