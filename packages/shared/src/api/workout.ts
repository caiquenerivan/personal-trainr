import { AxiosError, type AxiosInstance } from 'axios';
import type {
  ClientWorkoutLog,
  ExerciseLoadHistory,
  ExerciseLoadSummary,
  MyRoutine,
  StudentDashboard,
  SyncResult,
  WorkoutLog,
} from '../types/workout';

export function createWorkoutApi(api: AxiosInstance) {
  return {
    // null = nenhuma rotina ativa (o backend responde 404).
    async getMyRoutine(): Promise<MyRoutine | null> {
      try {
        const response = await api.get<MyRoutine>('/api/my-routine');
        return response.data;
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) return null;
        throw error;
      }
    },

    async getDashboard() {
      const response = await api.get<StudentDashboard>('/api/students/dashboard');
      return response.data;
    },

    async getHistory() {
      const response = await api.get<{ logs: WorkoutLog[] }>('/api/workout/history');
      return response.data.logs;
    },

    async sync(logs: ClientWorkoutLog[]) {
      const response = await api.post<{ results: SyncResult[] }>('/api/workout/sync', { logs });
      return response.data.results;
    },

    async getLoadSummary() {
      const response = await api.get<{ exercises: ExerciseLoadSummary[] }>('/api/workout/progress');
      return response.data.exercises;
    },

    async getExerciseLoadHistory(exerciseId: string) {
      const response = await api.get<ExerciseLoadHistory>(`/api/workout/progress/${exerciseId}`);
      return response.data;
    },
  };
}

export type WorkoutApi = ReturnType<typeof createWorkoutApi>;
