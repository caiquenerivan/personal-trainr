import { api } from './client';

export async function listAllTrainers() {
  const response = await api.get('/api/trainers');
  return response.data;
}

export async function searchTrainers(q: string) {
  const response = await api.get('/api/trainers/search', { params: { q } });
  return response.data;
}

export async function getMyTrainers() {
  const response = await api.get('/api/connections/my-trainers');
  return response.data;
}

export async function removeConnection(connectionId: string) {
  const response = await api.delete(`/api/connections/${connectionId}`);
  return response.data;
}

export async function listMyRoutines() {
  const response = await api.get('/api/routines');
  return response.data;
}

export async function getMyStudents() {
  const response = await api.get('/api/students');
  return response.data;
}

export async function createConnection(trainerId: string) {
  const response = await api.post('/api/connections', { trainerId });
  return response.data;
}

export type AssignRoutinePayload = {
  routineId: string;
  alunoId: string;
  days: number;
  weeklyGoal: number;
  routineName?: string;
  workouts?: Array<{
    day: string;
    description?: string;
    exercises: Array<{ name: string; series: number; reps: number; rest: number }>;
  }>;
};

export async function assignRoutine(payload: AssignRoutinePayload) {
  const response = await api.post('/api/routines/assign', payload);
  return response.data;
}

export type StudentProgress = {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  connectionStatus: 'ACTIVE' | 'INACTIVE';
  weeklyGoal: number;
  workoutsLast7Days: number;
  weeklyStreak: number;
  adhesionRate: number;
};

export async function getStudentsProgress() {
  const response = await api.get<{ students: StudentProgress[] }>('/api/trainers/students-progress');
  return response.data;
}
