import { api } from './client';

export async function getMyRoutine() {
  const response = await api.get('/api/my-routine');
  return response.data;
}

export async function completeExercise(routineExerciseId: string, weightUsed?: number | null) {
  const response = await api.post('/api/workout/complete', {
    routineExerciseId,
    weightUsed: weightUsed ?? null,
  });
  return response.data;
}

export async function getWorkoutHistory() {
  const response = await api.get('/api/workout/history');
  return response.data;
}

export async function getDashboard() {
  const response = await api.get('/api/students/dashboard');
  return response.data;
}

export type UpdateProfilePayload = {
  name?: string;
  avatarFile?: File | null;
  phone?: string | null;
  weight?: number | null;
  height?: number | null;
  birthDate?: string | null;
  username?: string | null;
  bio?: string | null;
  instagram?: string | null;
};

export async function updateProfile(data: UpdateProfilePayload) {
  const formData = new FormData();

  if (data.name !== undefined) formData.append('name', data.name);
  if (data.avatarFile) {
    formData.append('avatar', data.avatarFile);
  }
  if (data.phone !== undefined) formData.append('phone', data.phone ?? '');
  if (data.weight !== undefined) formData.append('weight', String(data.weight ?? ''));
  if (data.height !== undefined) formData.append('height', String(data.height ?? ''));
  if (data.birthDate !== undefined) formData.append('birthDate', data.birthDate ?? '');
  if (data.username !== undefined) formData.append('username', data.username ?? '');
  if (data.bio !== undefined) formData.append('bio', data.bio ?? '');
  if (data.instagram !== undefined) formData.append('instagram', data.instagram ?? '');

  const response = await api.put('/api/users/profile', formData);
  return response.data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const response = await api.put('/api/users/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
}

