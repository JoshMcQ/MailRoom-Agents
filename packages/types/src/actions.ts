export type ReplyPayload = {
  draft_html: string;
  draft_text: string;
  subject?: string;
  to?: string[];
  cc?: string[];
  attachments?: { name: string; url: string }[];
  citations?: { source_id?: string; snippet?: string }[];
};

export type CreateIssuePayload = {
  provider: 'github' | 'jira' | 'linear';
  title: string;
  body: string;
  labels?: string[];
  dedupe_key?: string;
};

export type LogFeedbackPayload = {
  destination: 'notion' | 'airtable' | 'sheet';
  title: string;
  body: string;
  component?: string;
  sentiment?: 'pos' | 'neu' | 'neg';
  account?: { id?: string; name?: string; arr?: number };
};

export type CreateTicketPayload = {
  provider: 'zendesk' | 'freshdesk';
  subject: string;
  body: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
};
