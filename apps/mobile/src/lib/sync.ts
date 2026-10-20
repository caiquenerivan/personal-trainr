import { AxiosError } from 'axios';
import { workoutApi } from './api';
import { queryClient } from './queryClient';
import { getPendingLogs, removePendingLogs } from './workoutQueue';
import { useSyncStatus } from '../stores/syncStatus';

const BATCH_SIZE = 100;

let inFlight: Promise<void> | null = null;

// Envia a fila offline em lotes. Uma execução por vez: os gatilhos (abrir o
// app, voltar a conexão, finalizar treino) podem disparar juntos.
export function syncPendingLogs(userId: string): Promise<void> {
  inFlight ??= run(userId).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function run(userId: string) {
  const status = useSyncStatus.getState();
  status.setPending(getPendingLogs(userId).length);
  let sentAny = false;

  try {
    while (true) {
      const batch = getPendingLogs(userId).slice(0, BATCH_SIZE);
      if (batch.length === 0) break;

      status.setSyncing(true);
      const results = await workoutApi.sync(batch);
      // saved/duplicate já estão no servidor; rejected nunca vai passar
      // (rotina de outro usuário, registro velho demais), então também sai.
      removePendingLogs(userId, results.map((r) => r.clientId));
      sentAny = true;
      status.setPending(getPendingLogs(userId).length);
    }
    status.setError(null);
  } catch (error) {
    // Sem rede ou servidor fora: fica na fila para a próxima tentativa.
    const offline = error instanceof AxiosError && !error.response;
    status.setError(offline ? 'offline' : 'error');
  } finally {
    status.setSyncing(false);
    if (sentAny) {
      queryClient.invalidateQueries({ queryKey: ['workout'] });
    }
  }
}
