import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/supabase';
import { classifyEmail } from '@/lib/ai/agent-actions';

export async function POST(request: Request) {
  try {
    const { emailId, policyId } = await request.json();

    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
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

    // Classify the email
    const classification = await classifyEmail(email, policy);

    // Update the email with classification
    const { error: updateError } = await supabase
      .from('emails')
      .update({
        classification,
        status: 'classified',
        updated_at: new Date().toISOString(),
      })
      .eq('id', emailId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      success: true, 
      classification 
    });
  } catch (error) {
    console.error('Classification error:', error);
    return NextResponse.json(
      { error: 'Failed to classify email' },
      { status: 500 }
    );
  }
}
