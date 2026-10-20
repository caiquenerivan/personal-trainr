import type { ClientWorkoutLog, Day } from '@personaltrainr/shared';
import { kvStorage } from './kvStorage';

// Fila de exercícios concluídos ainda não enviados ao servidor, e o diário
// local de sessões (o servidor só guarda exercícios; duração e letra do
// treino ficam aqui). Tudo por usuário, para uma conta nunca enviar a fila
// de outra no mesmo aparelho.

export type LocalSession = {
  id: string;
  day: Day;
  title: string;
  startedAt: string;
  finishedAt: string;
  exerciseCount: number;
  clientIds: string[];
};

const MAX_SESSIONS = 100;

const queueKey = (userId: string) => `personaltrainr.syncQueue.${userId}`;
const sessionsKey = (userId: string) => `personaltrainr.sessions.${userId}`;

function read<T>(key: string): T[] {
  try {
    const raw = kvStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  kvStorage.setItem(key, JSON.stringify(items));
}

export function getPendingLogs(userId: string): ClientWorkoutLog[] {
  return read<ClientWorkoutLog>(queueKey(userId));
}

export function enqueueLogs(userId: string, logs: ClientWorkoutLog[]) {
  write(queueKey(userId), [...getPendingLogs(userId), ...logs]);
}

export function removePendingLogs(userId: string, clientIds: string[]) {
  const done = new Set(clientIds);
  write(
    queueKey(userId),
    getPendingLogs(userId).filter((log) => !done.has(log.clientId)),
  );
}

export function getLocalSessions(userId: string): LocalSession[] {
  return read<LocalSession>(sessionsKey(userId));
}

export function saveLocalSession(userId: string, session: LocalSession) {
  write(sessionsKey(userId), [session, ...getLocalSessions(userId)].slice(0, MAX_SESSIONS));
}
