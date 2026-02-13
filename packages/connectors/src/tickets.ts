import { z } from 'zod';
import { withRetry } from './retry';
import type { ConnectorContext, ConnectorResult } from './types';
import { toBase64 } from './utils';

const TicketSchema = z.object({
  provider: z.enum(['zendesk', 'freshdesk']),
  subject: z.string().min(1),
  body: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  tags: z.array(z.string()).optional()
});

export interface TicketConnector {
  createTicket: (input: unknown) => Promise<ConnectorResult>;
}

export function createTicketConnector(context: ConnectorContext = {}): TicketConnector {
  const fetchImpl = context.fetchImplementation ?? fetch;
  const logger = context.logger ?? console;
  const retry = withRetry();

  async function createTicket(input: unknown): Promise<ConnectorResult> {
    const payload = TicketSchema.parse(input);
    if (payload.provider === 'zendesk') {
      if (!process.env.ZENDESK_SUBDOMAIN || !process.env.ZENDESK_EMAIL || !process.env.ZENDESK_API_TOKEN) {
        logger.info('Zendesk connector in mock mode', { payload });
        return { id: 'mock-zendesk-ticket', url: 'mock://zendesk/ticket' };
      }
      return retry(async () => {
        const response = await fetchImpl(
          `https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets.json`,
          {
            method: 'POST',
            headers: {
              authorization: `Basic ${toBase64(
                `${process.env.ZENDESK_EMAIL}/token:${process.env.ZENDESK_API_TOKEN}`
              )}`,
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              ticket: {
                subject: payload.subject,
                comment: { body: payload.body },
                priority: payload.priority,
                tags: payload.tags
              }
            })
          }
        );
        if (!response.ok) {
          logger.error('Zendesk ticket creation failed', { status: response.status });
          throw new Error('Zendesk ticket creation failed');
        }
        const data = await response.json();
        const ticket = data.ticket;
        return { id: String(ticket?.id ?? ''), url: ticket?.url, raw: data };
      });
    }

    if (!process.env.FRESHDESK_DOMAIN || !process.env.FRESHDESK_API_KEY) {
      logger.info('Freshdesk connector in mock mode', { payload });
      return { id: 'mock-freshdesk-ticket', url: 'mock://freshdesk/ticket' };
    }

    return retry(async () => {
      const response = await fetchImpl(`https://${process.env.FRESHDESK_DOMAIN}.freshdesk.com/api/v2/tickets`, {
        method: 'POST',
        headers: {
          authorization: `Basic ${toBase64(`${process.env.FRESHDESK_API_KEY}:X`)}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          subject: payload.subject,
          description: payload.body,
          priority: payload.priority,
          tags: payload.tags
        })
      });
      if (!response.ok) {
        logger.error('Freshdesk ticket creation failed', { status: response.status });
        throw new Error('Freshdesk ticket creation failed');
      }
      const data = await response.json();
      return { id: String(data?.id ?? ''), url: data?.url, raw: data };
    });
  }

  return { createTicket };
}
