import pRetry, { AbortError } from 'p-retry';
import type { Retryable } from './types';

export function withRetry(options?: { retries?: number; factor?: number }): Retryable {
  return async <T>(operation: () => Promise<T>) =>
    pRetry(operation, {
      retries: options?.retries ?? 3,
      factor: options?.factor ?? 2,
      onFailedAttempt(error) {
        if (error instanceof AbortError) {
          throw error;
        }
      }
    });
}
