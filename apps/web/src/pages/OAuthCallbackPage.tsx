import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { UserData } from '../api/auth';

function routeForRole(role: UserData['role']): string {
  if (role === 'ALUNO') return '/aluno/painel';
  if (role === 'ADMIN') return '/admin';
  return '/painel';
}

// Destino do redirect do backend após um login social bem-sucedido. O token
// chega curto na querystring — lemos e limpamos a URL imediatamente para não
// deixá-lo no histórico do navegador.
export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const tempToken = searchParams.get('tempToken');
    const twoFactor = searchParams.get('twoFactor');

    window.history.replaceState({}, '', '/oauth/callback');

    if (twoFactor && tempToken) {
      navigate('/login', { replace: true, state: { tempToken } });
      return;
    }

    if (!token) {
      navigate('/login?oauth_error=1', { replace: true });
      return;
    }

    api
      .get('/api/users/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        const user = data.user as UserData;
        window.localStorage.setItem('personaltrainr.token', token);
        window.localStorage.setItem('personaltrainr.user', JSON.stringify(user));
        navigate(user.requiresTwoFactorSetup ? '/configurar-2fa' : routeForRole(user.role), {
          replace: true,
          state: user.requiresTwoFactorSetup ? { forced: true } : undefined,
        });
      })
      .catch(() => navigate('/login?oauth_error=1', { replace: true }));
  }, [navigate, searchParams]);

  return (
    <main className="grid min-h-screen place-items-center bg-base px-5 font-body">
      <p className="text-sm text-text-secondary">Entrando...</p>
    </main>
  );
}
