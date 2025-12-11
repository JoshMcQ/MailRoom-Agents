export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          plan: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          plan?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      users_public: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users_public']['Insert']>;
      };
      org_members: {
        Row: {
          org_id: string;
          user_id: string;
          role: 'admin' | 'agent' | 'viewer';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          org_id: string;
          user_id: string;
          role?: 'admin' | 'agent' | 'viewer';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['org_members']['Insert']>;
      };
      mailboxes: {
        Row: {
          id: string;
          org_id: string;
          address: string;
          display_name: string | null;
          provider: 'gmail' | 'ms365' | 'imap' | 'mock';
          settings: Json;
          sending_identity: Json | null;
          verified_sending: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          address: string;
          display_name?: string | null;
          provider?: 'gmail' | 'ms365' | 'imap' | 'mock';
          settings?: Json;
          sending_identity?: Json | null;
          verified_sending?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['mailboxes']['Insert']>;
      };
      threads: {
        Row: {
          id: string;
          mailbox_id: string;
          subject: string | null;
          status: 'open' | 'pending' | 'waiting_on_customer' | 'resolved' | 'closed';
          assignee_user_id: string | null;
          intent: string | null;
          confidence: number | null;
          last_message_at: string | null;
          external_thread_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mailbox_id: string;
          subject?: string | null;
          status?: 'open' | 'pending' | 'waiting_on_customer' | 'resolved' | 'closed';
          assignee_user_id?: string | null;
          intent?: string | null;
          confidence?: number | null;
          last_message_at?: string | null;
          external_thread_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['threads']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          direction: 'inbound' | 'outbound' | 'internal';
          sender: string | null;
          recipients: Json;
          text: string | null;
          html: string | null;
          attachments: Json;
          created_at: string;
          embedding: number[] | null;
        };
        Insert: {
          id?: string;
          thread_id: string;
          direction: 'inbound' | 'outbound' | 'internal';
          sender?: string | null;
          recipients?: Json;
          text?: string | null;
          html?: string | null;
          attachments?: Json;
          created_at?: string;
          embedding?: number[] | null;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      actions: {
        Row: {
          id: string;
          thread_id: string;
          type: 'reply' | 'create_ticket' | 'create_issue' | 'log_feedback' | 'create_crm_lead' | 'schedule_meeting' | 'tag' | 'escalate';
          payload: Json;
          agent_confidence: number | null;
          state: 'proposed' | 'approved' | 'executed' | 'rejected' | 'failed';
          actor: 'agent' | 'human' | 'system';
          executed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          type: 'reply' | 'create_ticket' | 'create_issue' | 'log_feedback' | 'create_crm_lead' | 'schedule_meeting' | 'tag' | 'escalate';
          payload: Json;
          agent_confidence?: number | null;
          state?: 'proposed' | 'approved' | 'executed' | 'rejected' | 'failed';
          actor?: 'agent' | 'human' | 'system';
          executed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['actions']['Insert']>;
      };
      approvals: {
        Row: {
          id: string;
          action_id: string;
          approver_user_id: string | null;
          status: 'pending' | 'approved' | 'rejected';
          note: string | null;
          decided_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          action_id: string;
          approver_user_id?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          note?: string | null;
          decided_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['approvals']['Insert']>;
      };
      policies: {
        Row: {
          id: string;
          mailbox_id: string;
          spec: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mailbox_id: string;
          spec: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['policies']['Insert']>;
      };
      knowledge_sources: {
        Row: {
          id: string;
          org_id: string;
          type: 'doc' | 'kb' | 'release_notes' | 'faq' | 'tickets';
          url: string | null;
          meta: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          type: 'doc' | 'kb' | 'release_notes' | 'faq' | 'tickets';
          url?: string | null;
          meta?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['knowledge_sources']['Insert']>;
      };
      kb_chunks: {
        Row: {
          id: string;
          org_id: string;
          source_id: string | null;
          title: string | null;
          body: string;
          metadata: Json | null;
          embedding: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          source_id?: string | null;
          title?: string | null;
          body: string;
          metadata?: Json | null;
          embedding?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['kb_chunks']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          org_id: string;
          type: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          type: string;
          payload?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      work_queue: {
        Row: {
          id: number;
          kind: 'classify_and_propose' | 'send_action' | 'reindex_kb';
          payload: Json;
          attempts: number;
          run_at: string;
          locked_at: string | null;
          done: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          kind: 'classify_and_propose' | 'send_action' | 'reindex_kb';
          payload: Json;
          attempts?: number;
          run_at?: string;
          locked_at?: string | null;
          done?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['work_queue']['Insert']>;
      };
      api_keys: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          hashed_key: string;
          scope: Json;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          hashed_key: string;
          scope?: Json;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['api_keys']['Insert']>;
      };
      webhook_endpoints: {
        Row: {
          id: string;
          org_id: string;
          url: string;
          secret: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          url: string;
          secret: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['webhook_endpoints']['Insert']>;
      };
    };
    Views: never;
    Functions: never;
    Enums: {
      member_role: 'admin' | 'agent' | 'viewer';
      mailbox_provider: 'gmail' | 'ms365' | 'imap' | 'mock';
      thread_status: 'open' | 'pending' | 'waiting_on_customer' | 'resolved' | 'closed';
      message_direction: 'inbound' | 'outbound' | 'internal';
      action_type:
        | 'reply'
        | 'create_ticket'
        | 'create_issue'
        | 'log_feedback'
        | 'create_crm_lead'
        | 'schedule_meeting'
        | 'tag'
        | 'escalate';
      action_state: 'proposed' | 'approved' | 'executed' | 'rejected' | 'failed';
      action_actor: 'agent' | 'human' | 'system';
      approval_status: 'pending' | 'approved' | 'rejected';
      knowledge_source_type: 'doc' | 'kb' | 'release_notes' | 'faq' | 'tickets';
      work_kind: 'classify_and_propose' | 'send_action' | 'reindex_kb';
    };
  };
}
