import { z } from 'zod';
import { withRetry } from './retry';
import type { ConnectorContext } from './types';

const SlackMessageSchema = z.object({
  channel: z.string().min(1),
  text: z.string().optional(),
  blocks: z.array(z.record(z.string(), z.any())).optional()
});

export interface SlackConnector {
  postMessage: (channel: string, blocks?: unknown) => Promise<void>;
}

export function createSlackConnector(context: ConnectorContext = {}): SlackConnector {
  const fetchImpl = context.fetchImplementation ?? fetch;
  const logger = context.logger ?? console;
  const retry = withRetry();

  async function postMessage(channel: string, blocks?: unknown): Promise<void> {
    const payload = SlackMessageSchema.parse({ channel, text: 'Mailroom Agents alert', blocks });

    if (!process.env.SLACK_BOT_TOKEN) {
      logger.info('Slack connector in mock mode', { payload });
      return;
    }

    await retry(async () => {
      const response = await fetchImpl('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          'content-type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          channel: payload.channel,
          text: payload.text,
          blocks: payload.blocks
        })
      });
      if (!response.ok) {
        logger.error('Slack post failed', { status: response.status });
        throw new Error('Slack request failed');
      }
      const data = await response.json();
      if (!data.ok) {
        logger.error('Slack API error', { error: data.error });
        throw new Error('Slack API error');
      }
    });
  }

  return { postMessage };
}
