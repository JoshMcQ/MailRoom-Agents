import { describe, expect, it } from 'vitest';
import { createEmailConnector } from '../src/email';

describe('Email connector', () => {
  it('returns mock result when SMTP not configured', async () => {
    const connector = createEmailConnector({ logger: { info: () => {}, error: () => {} } });
    const result = await connector.send({
      from: 'support@example.com',
      to: ['user@example.com'],
      subject: 'Test',
      html: '<p>Hello</p>',
      text: 'Hello'
    });
    expect(result.id).toContain('mock-email');
  });
});
