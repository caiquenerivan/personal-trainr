import { AxiosError, create as createAxios, type InternalAxiosRequestConfig } from 'axios';
import { createAuthApi, createConnectionApi, createTrainerApi, createWorkoutApi } from '@personaltrainr/shared';
import { API_URL } from './config';
import { getAccessToken, getRefreshToken, saveTokens, saveUser } from './sessionStorage';

const TIMEOUT_MS = 15_000;

// Sem interceptors: usado pelas rotas de auth (login, refresh, logout), que
// não podem disparar o fluxo de refresh delas mesmas.
const publicClient = createAxios({ baseURL: API_URL, timeout: TIMEOUT_MS });
export const authApi = createAuthApi(publicClient);

export const api = createAxios({ baseURL: API_URL, timeout: TIMEOUT_MS });
export const workoutApi = createWorkoutApi(api);
export const trainerApi = createTrainerApi(api);
export const connectionApi = createConnectionApi(api);

let onSessionExpired: () => void = () => {};

// O store de auth registra aqui o que fazer quando o refresh token não vale
// mais (evita import circular entre api.ts e o store).
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

export class SessionExpiredError extends Error {}

// Uma única renovação por vez: o backend revoga o refresh token a cada uso,
// então duas renovações paralelas com o mesmo token derrubariam a sessão.
let refreshInFlight: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  refreshInFlight ??= (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new SessionExpiredError();
    try {
      const session = await authApi.refresh(refreshToken);
      await saveTokens(session.token, session.refreshToken);
      await saveUser(session.user);
      return session.token;
    } catch (error) {
      // Só um 401 significa sessão inválida; erro de rede (academia sem
      // sinal) mantém o usuário logado para tentar de novo depois.
      if (error instanceof AxiosError && error.response?.status === 401) {
        throw new SessionExpiredError();
      }
      throw error;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

api.interceptors.request.use(async (config) => {
  let token = getAccessToken();
  if (!token) {
    try {
      token = await refreshAccessToken();
    } catch {
      // segue sem token; o 401 da resposta trata o caso
    }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    if (error.response?.status !== 401 || !config || config._retried) {
      throw error;
    }

    config._retried = true;
    try {
      const token = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return api(config);
    } catch (refreshError) {
      if (refreshError instanceof SessionExpiredError) {
        onSessionExpired();
      }
      throw error;
    }
  },
);

// Plano do personal não inclui o recurso (painel, progresso dos alunos).
export function isPlanLocked(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 403;
}

// Mensagem do backend ({ message }) quando houver, senão um texto genérico.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    if (!error.response) return 'Sem conexão com o servidor. Verifique sua internet.';
    const message = (error.response.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
