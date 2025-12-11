export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function toBase64(input: string): string {
  if (typeof btoa === 'function') {
    return btoa(input);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'utf-8').toString('base64');
  }
  throw new Error('Base64 conversion is not supported in this environment');
}
