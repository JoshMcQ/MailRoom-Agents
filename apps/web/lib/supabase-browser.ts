'use client';

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';
import type { Database } from '@mailroom/types/supabase';

export function useSupabaseBrowser() {
  return useState(() => createBrowserSupabaseClient<Database>())[0];
}
