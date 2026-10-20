import { create } from 'zustand';
import type { Session, UserData } from '@personaltrainr/shared';
import { api, authApi, setSessionExpiredHandler } from '../lib/api';
import { clearSession, getRefreshToken, loadSession, saveTokens, saveUser } from '../lib/sessionStorage';
import { queryClient } from '../lib/queryClient';
import { signOutFromGoogle } from '../lib/googleSignIn';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthState = {
  status: AuthStatus;
  user: UserData | null;
  bootstrap: () => Promise<void>;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: UserData) => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,

  // Abre logado só com o que está no aparelho, sem esperar a rede: o aluno
  // precisa entrar no app mesmo sem sinal na academia. O perfil é atualizado
  // em segundo plano quando houver conexão.
  async bootstrap() {
    const stored = await loadSession();
    if (!stored) {
      set({ status: 'signedOut', user: null });
      return;
    }
    set({ status: 'signedIn', user: stored.user });

    api
      .get<{ user: UserData }>('/api/users/profile')
      .then((response) => get().setUser(response.data.user))
      .catch(() => {});
  },

  async signIn(session) {
    if (!session.refreshToken) {
      throw new Error('Sessão sem refresh token: o login precisa ser feito com client "mobile".');
    }
    await saveTokens(session.token, session.refreshToken);
    await saveUser(session.user);
    set({ status: 'signedIn', user: session.user });
  },

  async signOut() {
    const refreshToken = await getRefreshToken();
    await clearSession();
    queryClient.clear();
    set({ status: 'signedOut', user: null });
    if (refreshToken) {
      authApi.logout(refreshToken).catch(() => {});
    }
    // Sem isso o seletor de contas do Google não reaparece no próximo login.
    signOutFromGoogle();
  },

  async setUser(user) {
    await saveUser(user);
    set({ user });
  },
}));

setSessionExpiredHandler(() => {
  if (useAuth.getState().status === 'signedIn') {
    useAuth.getState().signOut();
  }
});
