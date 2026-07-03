import { api } from './client';

type RoutineExerciseInput = {
  exerciseId: string;
  day: string;
  series: number;
  reps: number;
  restTime: number;
};

type CreateRoutinePayload = {
  name: string;
  type: string;
  exercises: RoutineExerciseInput[];
};

export async function createRoutine(payload: CreateRoutinePayload) {
  const response = await api.post('/api/routines', payload);
  return response.data;
}
