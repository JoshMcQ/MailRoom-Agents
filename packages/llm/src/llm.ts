import { getProvider } from './provider';
import type { LlmRequest, LlmResponse } from './types';

export async function complete(request: LlmRequest): Promise<LlmResponse> {
  const provider = getProvider();
  return provider.complete(request);
}
