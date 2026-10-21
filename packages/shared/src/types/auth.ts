export type Role = 'TRAINER' | 'ALUNO' | 'ADMIN';

export type UserData = {
  id: string;
  name: string;
  email: string;
  role: Role;
  username?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  instagram?: string | null;
  weight?: number | null;
  height?: number | null;
  birthDate?: string | null;
  objective?: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  requiresTwoFactorSetup?: boolean;
};

// "mobile" faz o backend devolver também um refresh token (o web fica só
// com o JWT de 1 dia).
export type ClientType = 'web' | 'mobile';

export type LoginPayload = {
  email: string;
  password: string;
  client?: ClientType;
};

export type Session = {
  token: string;
  refreshToken?: string;
  user: UserData;
};

export type TwoFactorChallenge = {
  requiresTwoFactor: true;
  tempToken: string;
};

export type LoginResponse = Session | TwoFactorChallenge;

export function isTwoFactorChallenge(response: LoginResponse): response is TwoFactorChallenge {
  return 'requiresTwoFactor' in response;
}

// Objetivos de treino aceitos pelo backend (auth-service valida a mesma lista).
export const OBJECTIVES = [
  'Hipertrofia',
  'Emagrecimento',
  'Definição',
  'Força',
  'Condicionamento',
  'Resistência',
  'Saúde e bem-estar',
] as const;

export type Objective = (typeof OBJECTIVES)[number];
