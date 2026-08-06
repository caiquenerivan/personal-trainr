import { api } from './client';

export type ApiExercise = {
  id: string;
  trainerId: string | null;
  name: string;
  videoUrl: string | null;
  gifUrl: string | null;
  muscle: string | null;
  weightTrack: string | null;
  observations: string | null;
};

export type ExercisePayload = {
  name: string;
  videoUrl?: string | null;
  gifUrl?: string | null;
  muscle?: string | null;
  weightTrack?: string | null;
  observations?: string | null;
};

export async function listExercises() {
  const response = await api.get<{ exercises: ApiExercise[] }>('/api/exercises');
  return response.data.exercises;
}

export async function createExercise(payload: ExercisePayload) {
  const response = await api.post<{ exercise: ApiExercise }>('/api/exercises', payload);
  return response.data.exercise;
}

export async function updateExercise(id: string, payload: Partial<ExercisePayload>) {
  const response = await api.put<{ exercise: ApiExercise }>(`/api/exercises/${id}`, payload);
  return response.data.exercise;
}

export async function deleteExercise(id: string) {
  await api.delete(`/api/exercises/${id}`);
}
