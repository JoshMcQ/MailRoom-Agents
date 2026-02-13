import type { ConnectorContext } from './types';
import { createEmailConnector, type EmailConnector } from './email';
import { createIssueConnector, type IssueConnector } from './issues';
import { createTicketConnector, type TicketConnector } from './tickets';
import { createFeedbackConnector, type FeedbackConnector } from './feedback';
import { createCrmConnector, type CrmConnector } from './crm';
import { createSlackConnector, type SlackConnector } from './slack';

export type ConnectorRegistry = {
  email: EmailConnector;
  issues: IssueConnector;
  tickets: TicketConnector;
  feedback: FeedbackConnector;
  crm: CrmConnector;
  slack: SlackConnector;
};

export function createConnectorRegistry(context: ConnectorContext = {}): ConnectorRegistry {
  return {
    email: createEmailConnector(context),
    issues: createIssueConnector(context),
    tickets: createTicketConnector(context),
    feedback: createFeedbackConnector(context),
    crm: createCrmConnector(context),
    slack: createSlackConnector(context)
  };
}

export * from './types';
