import { EmailSendSchema, type ConnectorContext, type ConnectorResult } from './types';
import { withRetry } from './retry';
import { hashString, toBase64 } from './utils';

export interface EmailConnector {
  send: (input: unknown) => Promise<ConnectorResult>;
}

export function createEmailConnector(context: ConnectorContext = {}): EmailConnector {
  const fetchImpl = context.fetchImplementation ?? fetch;
  const logger = context.logger ?? console;
  const retry = withRetry();

  async function send(input: unknown): Promise<ConnectorResult> {
    const payload = EmailSendSchema.parse(input);
    const messageIdHash = await hashString(JSON.stringify(payload));
    const messageId = messageIdHash.slice(0, 12);

    const usingSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    if (!usingSmtp) {
      logger.info('Email connector operating in mock mode', { payload });
      return {
        id: `mock-email-${messageId}`,
        url: `mock://email/${messageId}`,
        raw: { mode: 'mock', payload }
      };
    }

    return retry(async () => {
      const response = await fetchImpl('https://api.mailroom-agents/send', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${toBase64(`${process.env.SMTP_USER}:${process.env.SMTP_PASS}`)}`
        },
        body: JSON.stringify({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          ...payload
        })
      });

      if (!response.ok) {
        const body = await response.text();
        logger.error('Email send failed', { status: response.status, body });
        throw new Error(`Email send failed with status ${response.status}`);
      }

      const data = await response.json().catch(() => ({ id: messageId }));
      return {
        id: data.id ?? messageId,
        url: data.url ?? `smtp://${process.env.SMTP_HOST}/${messageId}`,
        raw: data
      };
    });
  }

  return { send };
}
