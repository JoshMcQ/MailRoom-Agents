import { z } from 'zod';
import { withRetry } from './retry';
import type { ConnectorContext, ConnectorResult } from './types';

const LeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  company: z.string().optional(),
  notes: z.string().optional()
});

export interface CrmConnector {
  createLead: (input: unknown) => Promise<ConnectorResult>;
}

export function createCrmConnector(context: ConnectorContext = {}): CrmConnector {
  const fetchImpl = context.fetchImplementation ?? fetch;
  const logger = context.logger ?? console;
  const retry = withRetry();

  async function createLead(input: unknown): Promise<ConnectorResult> {
    const payload = LeadSchema.parse(input);

    if (process.env.HUBSPOT_TOKEN) {
      return retry(async () => {
        const response = await fetchImpl('https://api.hubapi.com/crm/v3/objects/contacts', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            properties: {
              email: payload.email,
              firstname: payload.name.split(' ')[0],
              lastname: payload.name.split(' ').slice(1).join(' ') || 'Contact',
              company: payload.company,
              notes: payload.notes
            }
          })
        });
        if (!response.ok) {
          logger.error('HubSpot lead creation failed', { status: response.status });
          throw new Error('HubSpot lead creation failed');
        }
        const data = await response.json();
        return { id: data.id, url: data.url, raw: data };
      });
    }

    if (
      process.env.SALESFORCE_CLIENT_ID &&
      process.env.SALESFORCE_CLIENT_SECRET &&
      process.env.SALESFORCE_USERNAME &&
      process.env.SALESFORCE_PASSWORD
    ) {
      logger.info('Salesforce connector in mock mode (token exchange not implemented)', { payload });
      return { id: 'mock-salesforce-lead', url: 'mock://salesforce/lead' };
    }

    logger.info('CRM connector defaulting to mock mode', { payload });
    return { id: 'mock-crm-lead', url: 'mock://crm/lead' };
  }

  return { createLead };
}
