import { createClient, type SupabaseClient } from '../deps.ts';
import type { Database } from '../../../packages/types/src/supabase.ts';

export function getServiceClient(): SupabaseClient<Database> {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('Supabase service credentials are missing');
  }
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false
    }
  });
}
