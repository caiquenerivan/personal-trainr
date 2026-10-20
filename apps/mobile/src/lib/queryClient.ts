import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { kvStorage } from './kvStorage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mantém os dados do cache persistido por uma semana para o app abrir
      // a rotina sem internet.
      gcTime: 7 * 24 * 60 * 60 * 1000,
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export const queryPersister = createSyncStoragePersister({
  storage: kvStorage,
  key: 'personaltrainr.queryCache',
});
