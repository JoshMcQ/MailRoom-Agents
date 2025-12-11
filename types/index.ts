// Database types
export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  settings: TenantSettings;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  max_agents: number;
  max_mailboxes: number;
  features: string[];
}

export interface Mailbox {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  type: 'shared' | 'personal';
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Email {
  id: string;
  mailbox_id: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  html_body?: string;
  received_at: string;
  classification?: EmailClassification;
  status: EmailStatus;
  assigned_agent_id?: string;
  created_at: string;
  updated_at: string;
}

export type EmailStatus = 
  | 'pending' 
  | 'classified' 
  | 'draft_ready' 
  | 'reviewed' 
  | 'sent' 
  | 'archived';

export interface EmailClassification {
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: string;
  tags: string[];
  confidence: number;
}

export interface Agent {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  policy_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type AgentCapability = 
  | 'classify' 
  | 'draft' 
  | 'route' 
  | 'trigger_actions';

export interface Policy {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  tone_settings: ToneSettings;
  pii_settings: PIISettings;
  routing_rules: RoutingRule[];
  created_at: string;
  updated_at: string;
}

export interface PolicyRule {
  id: string;
  type: 'classification' | 'routing' | 'action' | 'content';
  condition: Record<string, any>;
  action: Record<string, any>;
  priority: number;
}

export interface ToneSettings {
  style: 'formal' | 'casual' | 'friendly' | 'professional';
  custom_instructions?: string;
  examples?: string[];
}

export interface PIISettings {
  detect: boolean;
  mask: boolean;
  allowed_types: string[];
  handling_rules: Record<string, string>;
}

export interface RoutingRule {
  id: string;
  condition: {
    field: string;
    operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than';
    value: any;
  };
  action: {
    type: 'assign_agent' | 'assign_team' | 'forward' | 'escalate';
    target: string;
  };
}

export interface Draft {
  id: string;
  email_id: string;
  content: string;
  html_content?: string;
  generated_by: string; // agent_id
  confidence: number;
  suggestions: string[];
  created_at: string;
  updated_at: string;
}

export interface Action {
  id: string;
  email_id: string;
  type: ActionType;
  status: 'pending' | 'completed' | 'failed';
  payload: Record<string, any>;
  result?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export type ActionType = 
  | 'create_ticket' 
  | 'update_crm' 
  | 'send_slack' 
  | 'log_feedback'
  | 'webhook';

export interface Queue {
  id: string;
  tenant_id: string;
  name: string;
  email_ids: string[];
  sla_hours: number;
  assigned_agents: string[];
  created_at: string;
  updated_at: string;
}

export interface SLA {
  id: string;
  queue_id: string;
  email_id: string;
  target_response_time: number; // in minutes
  actual_response_time?: number;
  status: 'met' | 'at_risk' | 'breached';
  created_at: string;
  updated_at: string;
}

export interface Analytics {
  tenant_id: string;
  period_start: string;
  period_end: string;
  metrics: {
    total_emails: number;
    classified_emails: number;
    drafted_emails: number;
    sent_emails: number;
    avg_response_time: number;
    sla_compliance_rate: number;
    agent_performance: Record<string, AgentMetrics>;
  };
}

export interface AgentMetrics {
  emails_processed: number;
  drafts_created: number;
  avg_confidence: number;
  accuracy_rate: number;
}

// Integration types
export interface Integration {
  id: string;
  tenant_id: string;
  type: IntegrationType;
  name: string;
  config: Record<string, any>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type IntegrationType = 
  | 'email_provider' 
  | 'crm' 
  | 'ticketing' 
  | 'slack' 
  | 'webhook';

// LLM types
export interface LLMRequest {
  model: string;
  prompt: string;
  temperature?: number;
  max_tokens?: number;
  context?: Record<string, any>;
}

export interface LLMResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  metadata?: Record<string, any>;
}
