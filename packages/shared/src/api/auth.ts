import type { AxiosInstance } from 'axios';
import type { ClientType, LoginPayload, LoginResponse, Session, UserData } from '../types/auth';

export function createAuthApi(api: AxiosInstance) {
  return {
    async login(payload: LoginPayload) {
      const response = await api.post<LoginResponse>('/api/auth/login', payload);
      return response.data;
    },

    async verifyTwoFactor(tempToken: string, code: string, client: ClientType = 'web') {
      const response = await api.post<Session>('/api/auth/2fa/verify', { tempToken, code, client });
      return response.data;
    },

    // Login nativo do app: o idToken vem do SDK do Google no aparelho.
    async googleMobile(idToken: string) {
      const response = await api.post<LoginResponse>('/api/auth/google/mobile', { idToken });
      return response.data;
    },

    async refresh(refreshToken: string) {
      const response = await api.post<Required<Session>>('/api/auth/refresh', { refreshToken });
      return response.data;
    },

    async logout(refreshToken: string) {
      const response = await api.post<{ message: string }>('/api/auth/logout', { refreshToken });
      return response.data;
    },

    async getProfile() {
      const response = await api.get<{ user: UserData }>('/api/users/profile');
      return response.data.user;
    },

    // Exclusão da própria conta: confirmation = "EXCLUIR"; password só para
    // contas com senha (login social não tem).
    async deleteAccount(confirmation: string, password?: string) {
      const response = await api.post<{ message: string }>('/api/users/me/delete', { confirmation, password });
      return response.data;
    },

    async forgotPassword(email: string) {
      const response = await api.post<{ message: string }>('/api/auth/forgot-password', { email });
      return response.data;
    },

    async resendVerification(email: string) {
      const response = await api.post<{ message: string }>('/api/auth/resend-verification', { email });
      return response.data;
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
