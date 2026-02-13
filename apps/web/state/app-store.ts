'use client';

import { create } from 'zustand';

interface AppState {
  selectedMailboxId: string | null;
  setSelectedMailbox: (mailboxId: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedMailboxId: null,
  setSelectedMailbox: (mailboxId) => set({ selectedMailboxId: mailboxId })
}));
