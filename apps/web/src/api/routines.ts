import { api } from './client';

export type RoutineType = 'AB' | 'ABC' | 'ABCD' | 'ABCDE';
export type Day = 'A' | 'B' | 'C' | 'D' | 'E';

export type RoutineExerciseInput = {
  exerciseId: string;
  day: Day;
  dayDescription?: string | null;
  series: number;
  reps: number;
  restTime: number;
};

export type RoutineExerciseDetail = {
  id: string;
  day: Day;
  dayDescription: string | null;
  series: number;
  reps: number;
  restTime: number;
  exercise: {
    id: string;
    name: string;
    videoUrl: string | null;
    gifUrl: string | null;
    muscle: string | null;
    weightTrack: string | null;
    observations: string | null;
  };
};

export type RoutineDetail = {
  id: string;
  trainerId: string;
  name: string;
  type: RoutineType;
  createdAt: string;
  exercises: RoutineExerciseDetail[];
};

export type RoutinePayload = {
  name: string;
  type: RoutineType;
  exercises: RoutineExerciseInput[];
};

export async function getRoutine(id: string) {
  const response = await api.get<{ routine: RoutineDetail }>(`/api/routines/${id}`);
  return response.data.routine;
}

export async function createRoutine(payload: RoutinePayload) {
  const response = await api.post<{ routine: RoutineDetail }>('/api/routines', payload);
  return response.data.routine;
}

export async function updateRoutine(id: string, payload: RoutinePayload) {
  const response = await api.put<{ routine: RoutineDetail }>(`/api/routines/${id}`, payload);
  return response.data.routine;
}

export async function deleteRoutine(id: string) {
  await api.delete(`/api/routines/${id}`);
}
