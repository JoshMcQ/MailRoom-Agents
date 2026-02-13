import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@mailroom/types/supabase';

export async function searchKb(client: SupabaseClient<Database>, orgId: string, query: string) {
  const { data, error } = await client
    .from('kb_chunks')
    .select('id, title, body, metadata')
    .eq('org_id', orgId)
    .ilike('body', `%${query}%`)
    .limit(5);
  if (error) throw error;
  return data ?? [];
}

export async function searchSolved(
  client: SupabaseClient<Database>,
  orgId: string,
  intent: string | null,
  query: string
) {
  const { data, error } = await client
    .from('messages')
    .select('id, text, html, thread_id')
    .eq('direction', 'outbound')
    .ilike('text', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) throw error;
  return (data ?? []).filter((message) => (intent ? message.text?.includes(intent) ?? false : true));
}
