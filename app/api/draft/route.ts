import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/supabase';
import { generateDraft } from '@/lib/ai/agent-actions';

export async function POST(request: Request) {
  try {
    const { emailId, agentId, policyId } = await request.json();

    if (!emailId || !agentId) {
      return NextResponse.json(
        { error: 'Email ID and Agent ID are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch the email
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .single();

    if (emailError || !email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    // Check if email is classified
    if (!email.classification) {
      return NextResponse.json(
        { error: 'Email must be classified first' },
        { status: 400 }
      );
    }

    // Fetch policy if provided
    let policy = null;
    if (policyId) {
      const { data: policyData } = await supabase
        .from('policies')
        .select('*')
        .eq('id', policyId)
        .single();
      
      policy = policyData;
    }

    // Generate draft
    const draft = await generateDraft(email, email.classification, policy);

    // Save the draft
    const { data: savedDraft, error: draftError } = await supabase
      .from('drafts')
      .insert({
        email_id: emailId,
        content: draft.content,
        generated_by: agentId,
        confidence: draft.confidence,
        suggestions: draft.suggestions,
      })
      .select()
      .single();

    if (draftError) {
      throw draftError;
    }

    // Update email status
    await supabase
      .from('emails')
      .update({
        status: 'draft_ready',
        updated_at: new Date().toISOString(),
      })
      .eq('id', emailId);

    return NextResponse.json({ 
      success: true, 
      draft: savedDraft 
    });
  } catch (error) {
    console.error('Draft generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate draft' },
      { status: 500 }
    );
  }
}
