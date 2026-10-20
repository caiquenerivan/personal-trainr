import { create } from 'zustand';

type SyncStatusState = {
  pending: number;
  syncing: boolean;
  error: 'offline' | 'error' | null;
  setPending: (pending: number) => void;
  setSyncing: (syncing: boolean) => void;
  setError: (error: 'offline' | 'error' | null) => void;
};

export const useSyncStatus = create<SyncStatusState>((set) => ({
  pending: 0,
  syncing: false,
  error: null,
  setPending: (pending) => set({ pending }),
  setSyncing: (syncing) => set({ syncing }),
  setError: (error) => set({ error }),
}));
