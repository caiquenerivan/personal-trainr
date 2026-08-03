import { api } from './client';

export type LoginPayload = {
  email: string;
  password: string;
};

export type UserData = {
  id: string;
  name: string;
  email: string;
  role: 'TRAINER' | 'ALUNO';
  avatarUrl?: string | null;
  phone?: string | null;
  weight?: number | null;
  height?: number | null;
  birthDate?: string | null;
};

export type LoginResponse = {
  token: string;
  user: UserData;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: 'TRAINER' | 'ALUNO';
  username?: string;
};

export type RegisterResponse = {
  user: UserData;
};

export async function login(payload: LoginPayload) {
  const response = await api.post<LoginResponse>('/api/auth/login', payload);
  return response.data;
}

export async function register(payload: RegisterPayload) {
  const response = await api.post<RegisterResponse>('/api/auth/register', payload);
  return response.data;
}

export async function forgotPassword(email: string) {
  const response = await api.post<{ message: string }>('/api/auth/forgot-password', { email });
  return response.data;
}

export async function resetPassword(token: string, newPassword: string) {
  const response = await api.post<{ message: string }>('/api/auth/reset-password', { token, newPassword });
  return response.data;
}
