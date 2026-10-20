import { secureStorage } from './secureStorage';
import type { UserData } from '@personaltrainr/shared';

const ACCESS_TOKEN_KEY = 'personaltrainr.accessToken';
const REFRESH_TOKEN_KEY = 'personaltrainr.refreshToken';
const USER_KEY = 'personaltrainr.user';

export type StoredSession = {
  accessToken: string | null;
  refreshToken: string;
  user: UserData;
};

// O access token também fica em memória: o interceptor do axios lê a cada
// requisição, e o SecureStore é assíncrono.
let accessTokenInMemory: string | null = null;

export function getAccessToken(): string | null {
  return accessTokenInMemory;
}

export async function loadSession(): Promise<StoredSession | null> {
  const [accessToken, refreshToken, userRaw] = await Promise.all([
    secureStorage.getItem(ACCESS_TOKEN_KEY),
    secureStorage.getItem(REFRESH_TOKEN_KEY),
    secureStorage.getItem(USER_KEY),
  ]);
  if (!refreshToken || !userRaw) return null;

  try {
    const user = JSON.parse(userRaw) as UserData;
    accessTokenInMemory = accessToken;
    return { accessToken, refreshToken, user };
  } catch {
    await clearSession();
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  return secureStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  accessTokenInMemory = accessToken;
  await Promise.all([
    secureStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
    secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function saveUser(user: UserData): Promise<void> {
  await secureStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearSession(): Promise<void> {
  accessTokenInMemory = null;
  await Promise.all([
    secureStorage.removeItem(ACCESS_TOKEN_KEY),
    secureStorage.removeItem(REFRESH_TOKEN_KEY),
    secureStorage.removeItem(USER_KEY),
  ]);
}
