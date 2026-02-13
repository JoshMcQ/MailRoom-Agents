import { z } from 'zod';
import { withRetry } from './retry';
import type { ConnectorContext, ConnectorResult } from './types';

const FeedbackSchema = z.object({
  destination: z.enum(['notion', 'airtable', 'sheet']),
  title: z.string().min(1),
  body: z.string().min(1),
  component: z.string().optional(),
  sentiment: z.enum(['pos', 'neu', 'neg']).optional(),
  account: z.object({ id: z.string().optional(), name: z.string().optional(), arr: z.number().optional() }).optional()
});

export interface FeedbackConnector {
  createFeedback: (input: unknown) => Promise<ConnectorResult>;
}

export function createFeedbackConnector(context: ConnectorContext = {}): FeedbackConnector {
  const fetchImpl = context.fetchImplementation ?? fetch;
  const logger = context.logger ?? console;
  const retry = withRetry();

  async function createFeedback(input: unknown): Promise<ConnectorResult> {
    const payload = FeedbackSchema.parse(input);

    if (payload.destination === 'notion') {
      if (!process.env.NOTION_TOKEN) {
        logger.info('Notion connector in mock mode', { payload });
        return { id: 'mock-notion-feedback', url: 'mock://notion/page' };
      }
      return retry(async () => {
        const response = await fetchImpl('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${process.env.NOTION_TOKEN}`,
            'content-type': 'application/json',
            'notion-version': '2022-06-28'
          },
          body: JSON.stringify({
            parent: { database_id: process.env.NOTION_DATABASE_ID },
            properties: {
              Name: { title: [{ text: { content: payload.title } }] },
              Sentiment: payload.sentiment ? { select: { name: payload.sentiment } } : undefined
            },
            children: [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: payload.body } }] } }]
          })
        });
        if (!response.ok) {
          logger.error('Notion feedback creation failed', { status: response.status });
          throw new Error('Notion feedback creation failed');
        }
        const data = await response.json();
        return { id: data.id, url: data.url, raw: data };
      });
    }

    if (payload.destination === 'airtable') {
      if (!process.env.AIRTABLE_TOKEN) {
        logger.info('Airtable connector in mock mode', { payload });
        return { id: 'mock-airtable-feedback', url: 'mock://airtable/record' };
      }
      return retry(async () => {
        const response = await fetchImpl('https://api.airtable.com/v0/appFeedback/Feedback', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              Title: payload.title,
              Details: payload.body,
              Sentiment: payload.sentiment,
              Account: payload.account?.name
            }
          })
        });
        if (!response.ok) {
          logger.error('Airtable feedback creation failed', { status: response.status });
          throw new Error('Airtable feedback creation failed');
        }
        const data = await response.json();
        return { id: data.id, url: data.url, raw: data };
      });
    }

    // Sheet destination is intentionally mock - integrate with Google Sheets later.
    logger.info('Sheet feedback destination uses mock implementation', { payload });
    return { id: 'mock-sheet-feedback', url: 'mock://sheet/row' };
  }

  return { createFeedback };
}
