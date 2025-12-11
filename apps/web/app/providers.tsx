'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import React, { ReactNode, useMemo, useState, createContext, useContext } from 'react';
import type { Database } from '@mailroom/types/supabase';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createBrowserSupabaseClient<Database>());
  const context = useMemo(() => ({ supabase }), [supabase]);

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseContext.Provider value={context}>{children}</SupabaseContext.Provider>
    </QueryClientProvider>
  );
}

type SupabaseContextValue = {
  supabase: ReturnType<typeof createBrowserSupabaseClient<Database>>;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('Supabase context missing');
  return ctx.supabase;
}
