import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@mailroom/types/supabase';

export function getServerSupabase() {
  return createServerComponentClient<Database>({ cookies });
}
