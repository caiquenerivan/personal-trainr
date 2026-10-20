import type { Day, MyRoutine, WorkoutLog } from '@personaltrainr/shared';
import type { LocalSession } from '../../lib/workoutQueue';
import { workoutTitle } from './naming';

export type HistoryEntry = {
  id: string;
  title: string;
  completedAt: string;
  exerciseCount: number;
  durationMinutes: number | null;
  pending: boolean;
};

// Junta o diário local (treinos feitos neste aparelho, com duração e status
// de envio) com os logs do servidor que não vieram dele (feitos no web ou em
// outro aparelho), agrupados por dia como o painel web faz.
export function buildHistory(params: {
  sessions: LocalSession[];
  serverLogs: WorkoutLog[];
  pendingClientIds: Set<string>;
  routine: MyRoutine | null | undefined;
}): HistoryEntry[] {
  const { sessions, serverLogs, pendingClientIds, routine } = params;

  const localClientIds = new Set(sessions.flatMap((s) => s.clientIds));
  const entries: HistoryEntry[] = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    completedAt: s.finishedAt,
    exerciseCount: s.exerciseCount,
    durationMinutes: Math.max(1, Math.round((Date.parse(s.finishedAt) - Date.parse(s.startedAt)) / 60000)),
    pending: s.clientIds.some((id) => pendingClientIds.has(id)),
  }));

  const dayOf = dayResolver(routine);
  const groups = new Map<string, { day: Day | null; logs: WorkoutLog[] }>();
  for (const log of serverLogs) {
    if (log.clientId && localClientIds.has(log.clientId)) continue;
    const date = new Date(log.completedAt).toDateString();
    const day = dayOf(log);
    const key = `${date}|${day ?? '?'}`;
    const group = groups.get(key) ?? { day, logs: [] };
    group.logs.push(log);
    groups.set(key, group);
  }

  for (const [key, { day, logs }] of groups) {
    const latest = logs.reduce((a, b) => (a.completedAt > b.completedAt ? a : b));
    entries.push({
      id: `server-${key}`,
      title: day ? workoutTitle(routine, day) : 'TREINO',
      completedAt: latest.completedAt,
      exerciseCount: logs.length,
      durationMinutes: null,
      pending: false,
    });
  }

  return entries.sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
}

function dayResolver(routine: MyRoutine | null | undefined) {
  const byRoutineExercise = new Map<string, Day>();
  const byExercise = new Map<string, Day>();
  for (const [day, exercises] of Object.entries(routine?.exercises ?? {})) {
    for (const re of exercises ?? []) {
      byRoutineExercise.set(re.id, day as Day);
      if (!byExercise.has(re.exerciseId)) byExercise.set(re.exerciseId, day as Day);
    }
  }
  return (log: WorkoutLog): Day | null =>
    (log.routineExerciseId && byRoutineExercise.get(log.routineExerciseId)) ||
    (log.exerciseId && byExercise.get(log.exerciseId)) ||
    null;
}

// Letra do treino feito mais recentemente, juntando o diário local (inclui o
// que ainda não foi enviado) e os logs do servidor (web, outro aparelho).
export function lastWorkoutDay(params: {
  sessions: LocalSession[];
  serverLogs: WorkoutLog[];
  routine: MyRoutine | null | undefined;
}): Day | null {
  const { sessions, serverLogs, routine } = params;
  const dayOf = dayResolver(routine);
  let best: { at: number; day: Day } | null = null;
  for (const s of sessions) {
    const at = Date.parse(s.finishedAt);
    if (!best || at > best.at) best = { at, day: s.day };
  }
  for (const log of serverLogs) {
    const day = dayOf(log);
    const at = Date.parse(log.completedAt);
    if (day && (!best || at > best.at)) best = { at, day };
  }
  return best?.day ?? null;
}
