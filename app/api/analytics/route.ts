import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get email statistics
    const { data: emails } = await supabase
      .from('emails')
      .select('*, mailbox:mailboxes!inner(tenant_id)')
      .eq('mailbox.tenant_id', tenantId);

    const totalEmails = emails?.length || 0;
    const classifiedEmails = emails?.filter(e => e.status !== 'pending').length || 0;
    const draftedEmails = emails?.filter(e => e.status === 'draft_ready' || e.status === 'reviewed').length || 0;
    const sentEmails = emails?.filter(e => e.status === 'sent').length || 0;

    // Get SLA data
    const { data: slas } = await supabase
      .from('slas')
      .select('*, queue:queues!inner(tenant_id)')
      .eq('queue.tenant_id', tenantId);

    const totalSLAs = slas?.length || 0;
    const metSLAs = slas?.filter(s => s.status === 'met').length || 0;
    const slaComplianceRate = totalSLAs > 0 ? (metSLAs / totalSLAs) * 100 : 0;

    // Calculate average response time
    const responseTimes = slas
      ?.filter(s => s.actual_response_time)
      .map(s => s.actual_response_time) || [];
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Get agent performance
    const { data: agents } = await supabase
      .from('agents')
      .select('id, name')
      .eq('tenant_id', tenantId);

    const agentPerformance: Record<string, any> = {};
    
    for (const agent of agents || []) {
      const { data: agentEmails } = await supabase
        .from('emails')
        .select('*')
        .eq('assigned_agent_id', agent.id);

      const { data: agentDrafts } = await supabase
        .from('drafts')
        .select('confidence')
        .eq('generated_by', agent.id);

      agentPerformance[agent.name] = {
        emails_processed: agentEmails?.length || 0,
        drafts_created: agentDrafts?.length || 0,
        avg_confidence: agentDrafts && agentDrafts.length > 0
          ? agentDrafts.reduce((sum, d) => sum + (Number(d.confidence) || 0), 0) / agentDrafts.length
          : 0,
        accuracy_rate: 0.95, // Mock value - would need actual feedback data
      };
    }

    const analytics = {
      tenant_id: tenantId,
      period_start: periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: periodEnd || new Date().toISOString(),
      metrics: {
        total_emails: totalEmails,
        classified_emails: classifiedEmails,
        drafted_emails: draftedEmails,
        sent_emails: sentEmails,
        avg_response_time: Math.round(avgResponseTime),
        sla_compliance_rate: Math.round(slaComplianceRate * 100) / 100,
        agent_performance: agentPerformance,
      },
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
