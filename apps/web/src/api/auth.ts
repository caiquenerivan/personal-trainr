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
