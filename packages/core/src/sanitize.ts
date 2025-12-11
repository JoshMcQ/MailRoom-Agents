const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_REGEX = / on[a-z]+="[^"]*"/gi;

export function sanitizeHtml(html: string): string {
  return html.replace(SCRIPT_TAG_REGEX, '').replace(EVENT_HANDLER_REGEX, '');
}
