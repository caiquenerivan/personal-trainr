import type { AxiosInstance } from 'axios';
import type {
  AssignRoutinePayload,
  CatalogExercise,
  ExercisePayload,
  RoutineDetail,
  RoutinePayload,
  RoutineSummary,
  StudentProgress,
  Subscription,
  TrainerDashboard,
  TrainerStudent,
} from '../types/trainer';
import type { ExerciseLoadHistory, ExerciseLoadSummary } from '../types/workout';

export function createTrainerApi(api: AxiosInstance) {
  return {
    async getDashboard() {
      const response = await api.get<TrainerDashboard>('/api/trainers/dashboard');
      return response.data;
    },

    async getStudents() {
      const response = await api.get<{ students: TrainerStudent[] }>('/api/students');
      return response.data.students ?? [];
    },

    async getStudentsProgress() {
      const response = await api.get<{ students: StudentProgress[] }>('/api/trainers/students-progress');
      return response.data.students;
    },

    async getStudentLoadSummary(alunoId: string) {
      const response = await api.get<{ exercises: ExerciseLoadSummary[] }>(`/api/students/${alunoId}/progress`);
      return response.data.exercises;
    },

    async getStudentExerciseLoadHistory(alunoId: string, exerciseId: string) {
      const response = await api.get<ExerciseLoadHistory>(`/api/students/${alunoId}/progress/${exerciseId}`);
      return response.data;
    },

    async getSubscription() {
      const response = await api.get<{ subscription: Subscription }>('/api/users/subscription');
      return response.data.subscription;
    },

    async listRoutines() {
      const response = await api.get<{ routines: RoutineSummary[] }>('/api/routines');
      return response.data.routines ?? [];
    },

    async getRoutine(id: string) {
      const response = await api.get<{ routine: RoutineDetail }>(`/api/routines/${id}`);
      return response.data.routine;
    },

    async createRoutine(payload: RoutinePayload) {
      const response = await api.post<{ routine: RoutineDetail }>('/api/routines', payload);
      return response.data.routine;
    },

    async updateRoutine(id: string, payload: RoutinePayload) {
      const response = await api.put<{ routine: RoutineDetail }>(`/api/routines/${id}`, payload);
      return response.data.routine;
    },

    async deleteRoutine(id: string) {
      await api.delete(`/api/routines/${id}`);
    },

    async assignRoutine(payload: AssignRoutinePayload) {
      const response = await api.post('/api/routines/assign', payload);
      return response.data;
    },

    async listExercises() {
      const response = await api.get<{ exercises: CatalogExercise[] }>('/api/exercises');
      return response.data.exercises ?? [];
    },

    async createExercise(payload: ExercisePayload) {
      const response = await api.post<{ exercise: CatalogExercise }>('/api/exercises', payload);
      return response.data.exercise;
    },

    async updateExercise(id: string, payload: Partial<ExercisePayload>) {
      const response = await api.put<{ exercise: CatalogExercise }>(`/api/exercises/${id}`, payload);
      return response.data.exercise;
    },

    async deleteExercise(id: string) {
      await api.delete(`/api/exercises/${id}`);
    },
  };
}

export type TrainerApi = ReturnType<typeof createTrainerApi>;
