import { api } from './client';

export type LoadPoint = { weight: number; date: string };

export type ExerciseLoadSummary = {
  exerciseId: string;
  name: string;
  muscle: string | null;
  sessions: number;
  first: LoadPoint | null;
  last: LoadPoint | null;
  maxWeight: number | null;
  lastDoneAt: string;
};

export type ExerciseLoadHistory = {
  exerciseId: string;
  name: string | null;
  points: Array<{ date: string; weight: number | null }>;
};

// alunoId ausente = o próprio usuário logado; com alunoId = visão do personal sobre o aluno
export async function getLoadSummary(alunoId?: string) {
  const url = alunoId ? `/api/students/${alunoId}/progress` : '/api/workout/progress';
  const response = await api.get<{ exercises: ExerciseLoadSummary[] }>(url);
  return response.data.exercises;
}

export async function getExerciseLoadHistory(exerciseId: string, alunoId?: string) {
  const url = alunoId
    ? `/api/students/${alunoId}/progress/${exerciseId}`
    : `/api/workout/progress/${exerciseId}`;
  const response = await api.get<ExerciseLoadHistory>(url);
  return response.data;
}
