import { z } from 'zod';
import { withRetry } from './retry';
import type { ConnectorContext, ConnectorResult } from './types';
import { hashString, toBase64 } from './utils';

const IssueSchema = z.object({
  provider: z.enum(['github', 'jira', 'linear']),
  title: z.string().min(1),
  body: z.string().min(1),
  labels: z.array(z.string()).optional(),
  dedupe_key: z.string().optional()
});

export interface IssueConnector {
  createIssue: (input: unknown) => Promise<ConnectorResult>;
}

export function createIssueConnector(context: ConnectorContext = {}): IssueConnector {
  const fetchImpl = context.fetchImplementation ?? fetch;
  const logger = context.logger ?? console;
  const retry = withRetry();

  async function createIssue(input: unknown): Promise<ConnectorResult> {
    const payload = IssueSchema.parse(input);
    const dedupe = payload.dedupe_key ?? (await hashString(payload.title));

    switch (payload.provider) {
      case 'github':
        if (!process.env.GITHUB_TOKEN) {
          logger.info('GitHub connector in mock mode', { payload });
          return { id: `mock-github-${dedupe.slice(0, 10)}`, url: `mock://github/${dedupe}` };
        }
        return retry(async () => {
          const response = await fetchImpl('https://api.github.com/repos/example/repo/issues', {
            method: 'POST',
            headers: {
              authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              title: payload.title,
              body: payload.body,
              labels: payload.labels
            })
          });
          if (!response.ok) {
            const body = await response.text();
            logger.error('GitHub issue creation failed', { status: response.status, body });
            throw new Error(`GitHub issue creation failed`);
          }
          const data = await response.json();
          return { id: String(data.number), url: data.html_url ?? data.url, raw: data };
        });
      case 'jira':
        if (!process.env.JIRA_BASE_URL || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
          logger.info('Jira connector in mock mode', { payload });
          return { id: `mock-jira-${dedupe.slice(0, 10)}`, url: `mock://jira/${dedupe}` };
        }
        return retry(async () => {
          const response = await fetchImpl(`${process.env.JIRA_BASE_URL}/rest/api/3/issue`, {
            method: 'POST',
            headers: {
              authorization: `Basic ${toBase64(
                `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
              )}`,
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              fields: {
                summary: payload.title,
                description: payload.body,
                issuetype: { name: 'Bug' }
              }
            })
          });
          if (!response.ok) {
            logger.error('Jira issue creation failed', { status: response.status });
            throw new Error('Jira issue creation failed');
          }
          const data = await response.json();
          return { id: data.key, url: `${process.env.JIRA_BASE_URL}/browse/${data.key}`, raw: data };
        });
      case 'linear':
        if (!process.env.LINEAR_API_KEY) {
          logger.info('Linear connector in mock mode', { payload });
          return { id: `mock-linear-${dedupe.slice(0, 10)}`, url: `mock://linear/${dedupe}` };
        }
        return retry(async () => {
          const response = await fetchImpl('https://api.linear.app/graphql', {
            method: 'POST',
            headers: {
              authorization: process.env.LINEAR_API_KEY,
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              query: `mutation CreateIssue($input: IssueCreateInput!) { issueCreate(input: $input) { issue { id identifier url } } }`,
              variables: {
                input: {
                  title: payload.title,
                  description: payload.body,
                  labelIds: payload.labels
                }
              }
            })
          });
          if (!response.ok) {
            logger.error('Linear issue creation failed', { status: response.status });
            throw new Error('Linear issue creation failed');
          }
          const data = await response.json();
          const issue = data?.data?.issueCreate?.issue;
          return { id: issue?.identifier ?? dedupe.slice(0, 8), url: issue?.url, raw: data };
        });
      default:
        throw new Error(`Unhandled provider ${(payload as { provider: string }).provider}`);
    }
  }

  return { createIssue };
}
