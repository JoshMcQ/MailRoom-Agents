import { z } from 'zod';

export type Logger = {
  info: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};

export const EmailSendSchema = z.object({
  from: z.string().email(),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional(),
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().min(1),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url()
      })
    )
    .optional()
});

export type EmailSendInput = z.infer<typeof EmailSendSchema>;

export type ConnectorResult = {
  id: string;
  url?: string;
  raw?: unknown;
};

export type Retryable = <T>(operation: () => Promise<T>) => Promise<T>;

export interface ConnectorContext {
  fetchImplementation?: typeof fetch;
  logger?: Logger;
}
