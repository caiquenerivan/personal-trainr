import { useEffect } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { syncPendingLogs } from '../lib/sync';
import { useAuth } from '../stores/auth';

// Envia a fila offline ao entrar, ao voltar a conexão e ao trazer o app para
// frente. Também avisa o React Query do estado da rede, para ele pausar as
// buscas sem sinal em vez de falhar.
export function useSyncTriggers() {
  const userId = useAuth((s) => s.user?.id);

  useEffect(() => {
    if (!userId) return;
    syncPendingLogs(userId);

    const unsubscribeNet = NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      onlineManager.setOnline(online);
      if (online) syncPendingLogs(userId);
    });

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncPendingLogs(userId);
    });

    return () => {
      unsubscribeNet();
      appStateSub.remove();
    };
  }, [userId]);
}
