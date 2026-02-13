import { describe, expect, it } from 'vitest';
import { redactText, containsBlockedTerm } from '../src/pii';

describe('PII utilities', () => {
  it('redacts emails and phone numbers', () => {
    const redacted = redactText('Email joe@example.com call 555-123-4567', { enabled: true });
    expect(redacted).toBe('Email [[REDACTED]] call [[REDACTED]]');
  });

  it('detects blocked term', () => {
    const match = containsBlockedTerm('This includes secret sauce', ['secret']);
    expect(match).toBe('secret');
  });
});
