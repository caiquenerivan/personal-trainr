import type { ClientWorkoutLog, Day, RoutineExercise } from '@personaltrainr/shared';
import type { ActiveWorkout } from '../stores/activeWorkout';
import { enqueueLogs, saveLocalSession } from './workoutQueue';
import { syncPendingLogs } from './sync';
import { uuid } from './uuid';

// "40", "40,5", "40.5 kg" -> número; vazio ou inválido -> null.
export function parseWeight(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value.replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 && n <= 1000 ? n : null;
}

// Grava o treino primeiro no aparelho (fila + diário) e só depois tenta
// enviar: finalizar nunca depende de ter internet.
export function finishWorkout(params: {
  userId: string;
  day: Day;
  title: string;
  exercises: RoutineExercise[];
  workout: ActiveWorkout;
}) {
  const { userId, day, title, exercises, workout } = params;
  const done = exercises.filter((re) => workout.checked[re.id]);
  if (done.length === 0) return;

  const logs: ClientWorkoutLog[] = done.map((re) => ({
    clientId: uuid(),
    routineExerciseId: re.id,
    exerciseId: re.exerciseId,
    weightUsed: parseWeight(workout.weights[re.id]),
    completedAt: workout.checked[re.id],
  }));

  enqueueLogs(userId, logs);
  saveLocalSession(userId, {
    id: uuid(),
    day,
    title,
    startedAt: workout.startedAt ?? logs[0].completedAt,
    finishedAt: new Date().toISOString(),
    exerciseCount: logs.length,
    clientIds: logs.map((l) => l.clientId),
  });
  syncPendingLogs(userId);
}
