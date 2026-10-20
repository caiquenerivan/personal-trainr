import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Day } from '@personaltrainr/shared';
import { kvStorage } from '../lib/kvStorage';

// Treino em andamento: persiste no aparelho para o aluno poder fechar o app
// (ou ele ser morto pelo sistema) no meio do treino sem perder o que marcou.
export type ActiveWorkout = {
  day: Day;
  startedAt: string | null;
  // routineExerciseId -> horário em que foi marcado (vira o completedAt)
  checked: Record<string, string>;
  weights: Record<string, string>;
  restEndsAt: number | null;
};

const emptyWorkout = (day: Day = 'A'): ActiveWorkout => ({
  day,
  startedAt: null,
  checked: {},
  weights: {},
  restEndsAt: null,
});

type ActiveWorkoutState = {
  byUser: Record<string, ActiveWorkout>;
  selectDay: (userId: string, day: Day) => void;
  toggle: (userId: string, routineExerciseId: string, restSeconds: number) => void;
  setWeight: (userId: string, routineExerciseId: string, value: string) => void;
  stopRest: (userId: string) => void;
  reset: (userId: string) => void;
};

export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set) => {
      const update = (userId: string, fn: (w: ActiveWorkout) => ActiveWorkout) =>
        set((state) => ({
          byUser: { ...state.byUser, [userId]: fn(state.byUser[userId] ?? emptyWorkout()) },
        }));

      return {
        byUser: {},

        // Trocar de letra descarta o que foi marcado na outra: um treino por vez.
        selectDay: (userId, day) =>
          update(userId, (w) => (w.day === day ? w : { ...emptyWorkout(day), weights: w.weights })),

        toggle: (userId, routineExerciseId, restSeconds) =>
          update(userId, (w) => {
            const checked = { ...w.checked };
            const nowIso = new Date().toISOString();
            if (checked[routineExerciseId]) {
              delete checked[routineExerciseId];
              return { ...w, checked, restEndsAt: null };
            }
            checked[routineExerciseId] = nowIso;
            return {
              ...w,
              checked,
              startedAt: w.startedAt ?? nowIso,
              restEndsAt: restSeconds > 0 ? Date.now() + restSeconds * 1000 : null,
            };
          }),

        setWeight: (userId, routineExerciseId, value) =>
          update(userId, (w) => ({ ...w, weights: { ...w.weights, [routineExerciseId]: value } })),

        stopRest: (userId) => update(userId, (w) => ({ ...w, restEndsAt: null })),

        // Mantém a carga digitada: na próxima vez o aluno já vê a última usada.
        reset: (userId) => update(userId, (w) => ({ ...emptyWorkout(w.day), weights: w.weights })),
      };
    },
    {
      name: 'personaltrainr.activeWorkout',
      storage: createJSONStorage(() => kvStorage),
    },
  ),
);

export function useActiveWorkout(userId: string): ActiveWorkout {
  return useActiveWorkoutStore((s) => s.byUser[userId]) ?? EMPTY;
}

const EMPTY = emptyWorkout();
