import { api } from './client';

export type LoginPayload = {
  email: string;
  password: string;
};

export type UserData = {
  id: string;
  name: string;
  email: string;
  role: 'TRAINER' | 'ALUNO' | 'ADMIN';
  avatarUrl?: string | null;
  phone?: string | null;
  weight?: number | null;
  height?: number | null;
  birthDate?: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  requiresTwoFactorSetup?: boolean;
};

export type LoginResponse =
  | { token: string; user: UserData }
  | { requiresTwoFactor: true; tempToken: string };

export type TwoFactorSetupResponse = {
  secret: string;
  qrCodeDataUrl: string;
};

export type TwoFactorConfirmResponse = {
  message: string;
  backupCodes: string[];
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: 'TRAINER' | 'ALUNO';
  username?: string;
  cref?: string;
  crefState?: string;
  crefCity?: string;
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

export async function verifyEmail(token: string) {
  const response = await api.post<{ message: string }>('/api/auth/verify-email', { token });
  return response.data;
}

export async function resendVerification(email: string) {
  const response = await api.post<{ message: string }>('/api/auth/resend-verification', { email });
  return response.data;
}

export async function verifyTwoFactor(tempToken: string, code: string) {
  const response = await api.post<{ token: string; user: UserData }>('/api/auth/2fa/verify', { tempToken, code });
  return response.data;
}

export async function setupTwoFactor() {
  const response = await api.post<TwoFactorSetupResponse>('/api/users/2fa/setup');
  return response.data;
}

export async function confirmTwoFactor(code: string) {
  const response = await api.post<TwoFactorConfirmResponse>('/api/users/2fa/confirm', { code });
  return response.data;
}

export async function disableTwoFactor(code: string) {
  const response = await api.post<{ message: string }>('/api/users/2fa/disable', { code });
  return response.data;
}
