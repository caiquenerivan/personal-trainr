import { api } from './client';

export type Role = 'ADMIN' | 'TRAINER' | 'ALUNO';
export type PlanTier = 'FREE' | 'PRO' | 'UNLIMITED';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: Role;
  isActive: boolean;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  trainerProfile?: {
    cref: string;
    crefState: string;
    crefCity: string;
  } | null;
  subscription?: {
    plan: PlanTier;
    status: SubscriptionStatus;
  } | null;
};

export type ListUsersParams = {
  role?: Role;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function listUsers(params: ListUsersParams) {
  const response = await api.get<{ users: AdminUser[]; total: number; page: number; pageSize: number }>(
    '/api/admin/users',
    {
      params: {
        ...params,
        isActive: params.isActive === undefined ? undefined : String(params.isActive),
      },
    },
  );
  return response.data;
}

export async function getUser(id: string) {
  const response = await api.get<{ user: AdminUser }>(`/api/admin/users/${id}`);
  return response.data.user;
}

export type UpdateUserPayload = Partial<{
  name: string;
  email: string;
  username: string;
  phone: string | null;
  role: Role;
}>;

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const response = await api.put<{ user: AdminUser }>(`/api/admin/users/${id}`, payload);
  return response.data.user;
}

export async function setUserActive(id: string, isActive: boolean) {
  const response = await api.put<{ user: AdminUser }>(`/api/admin/users/${id}/status`, { isActive });
  return response.data.user;
}

export async function resetUserPassword(id: string) {
  const response = await api.post<{ tempPassword: string }>(`/api/admin/users/${id}/reset-password`);
  return response.data.tempPassword;
}

export async function deleteUser(id: string) {
  await api.delete(`/api/admin/users/${id}`);
}

export type AdminSubscription = {
  id: string;
  userId: string;
  plan: PlanTier;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; username: string };
};

export async function listSubscriptions() {
  const response = await api.get<{ subscriptions: AdminSubscription[] }>('/api/admin/subscriptions');
  return response.data.subscriptions;
}

export async function updateSubscription(userId: string, payload: { plan?: PlanTier; status?: SubscriptionStatus }) {
  const response = await api.put<{ subscription: AdminSubscription }>(`/api/admin/subscriptions/${userId}`, payload);
  return response.data.subscription;
}

export type AdminOverview = {
  users: { total: number; trainers: number; students: number; active: number; inactive: number };
  plans: { plan: PlanTier; count: number }[];
  subscriptionStatus: { status: SubscriptionStatus; count: number }[];
};

export async function getOverview() {
  const response = await api.get<AdminOverview>('/api/admin/overview');
  return response.data;
}

export type AdminWorkoutStats = {
  routines: number;
  exercises: number;
  globalExercises: number;
  connections: number;
  activeAssignments: number;
};

export async function getWorkoutStats() {
  const response = await api.get<AdminWorkoutStats>('/api/admin/stats');
  return response.data;
}

export type AdminExercise = {
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

export async function listGlobalExercises() {
  const response = await api.get<{ exercises: AdminExercise[] }>('/api/admin/exercises');
  return response.data.exercises;
}

export async function createGlobalExercise(payload: ExercisePayload) {
  const response = await api.post<{ exercise: AdminExercise }>('/api/admin/exercises', payload);
  return response.data.exercise;
}

export async function updateGlobalExercise(id: string, payload: Partial<ExercisePayload>) {
  const response = await api.put<{ exercise: AdminExercise }>(`/api/admin/exercises/${id}`, payload);
  return response.data.exercise;
}

export async function deleteGlobalExercise(id: string) {
  await api.delete(`/api/admin/exercises/${id}`);
}

export type AdminConnection = {
  id: string;
  status: string;
  createdAt: string;
  trainer: { id: string; name: string; email: string };
  student: { id: string; name: string; email: string };
};

export async function listConnections() {
  const response = await api.get<{ connections: AdminConnection[] }>('/api/admin/connections');
  return response.data.connections;
}

export async function removeConnection(id: string) {
  await api.delete(`/api/admin/connections/${id}`);
}
