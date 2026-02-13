const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /\+?\d[\d\s().-]{7,}\d/g;
const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;

export type RedactionOptions = {
  replaceWith?: string;
  enabled?: boolean;
};

const DEFAULT_REPLACEMENT = '[[REDACTED]]';

export function redactText(input: string, options: RedactionOptions = {}): string {
  if (!options.enabled) {
    return input;
  }

  const replacement = options.replaceWith ?? DEFAULT_REPLACEMENT;

  return input
    .replace(EMAIL_REGEX, replacement)
    .replace(PHONE_REGEX, replacement)
    .replace(CREDIT_CARD_REGEX, replacement);
}

export function containsBlockedTerm(input: string, blockedTerms: string[]): string | null {
  const lower = input.toLowerCase();
  const match = blockedTerms.find((term) => lower.includes(term.toLowerCase()));
  return match ?? null;
}
