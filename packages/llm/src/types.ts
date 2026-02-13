export interface LlmRequest {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  response_format?: unknown;
}

export interface LlmResponse {
  content: string;
  raw?: unknown;
}

export interface LlmProvider {
  complete(request: LlmRequest): Promise<LlmResponse>;
}

export interface ClassificationResult {
  intent: 'support' | 'bug' | 'feedback' | 'sales' | 'other';
  sentiment: 'pos' | 'neu' | 'neg';
  urgency: 'low' | 'medium' | 'high';
  entities: string[];
  confidence: number;
}

export interface DraftResult {
  html: string;
  text: string;
  citations: { source_id?: string; snippet?: string }[];
  confidence: number;
}

export interface ClassificationJobContext {
  supabase: import('@supabase/supabase-js').SupabaseClient<import('@mailroom/types/supabase').Database>;
  connectors: import('@mailroom/connectors').ConnectorRegistry;
  logger?: { info: (msg: string, meta?: Record<string, unknown>) => void; error: (msg: string, meta?: Record<string, unknown>) => void };
}

export interface ReindexJobContext {
  supabase: import('@supabase/supabase-js').SupabaseClient<import('@mailroom/types/supabase').Database>;
  logger?: { info: (msg: string, meta?: Record<string, unknown>) => void; error: (msg: string, meta?: Record<string, unknown>) => void };
}
