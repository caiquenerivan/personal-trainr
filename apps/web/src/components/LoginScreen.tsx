import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { login, resendVerification, verifyTwoFactor, type UserData } from '../api/auth';
import { api } from '../api/client';
import { createConnection } from '../api/connections';

function routeForRole(role: UserData['role']): string {
  if (role === 'ALUNO') return '/aluno/painel';
  if (role === 'ADMIN') return '/admin';
  return '/painel';
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function handleGoogleLogin() {
  window.location.href = `${API_URL}/api/auth/google`;
}

// Completa a conexão trainer<->aluno de um convite pendente (armazenado no
// cadastro) assim que o primeiro login pós-verificação de email acontece.
// Falha silenciosamente: o aluno ainda pode se conectar manualmente depois.
async function completePendingInvite() {
  const storedInvite = localStorage.getItem('@ptrainr:invite');
  if (!storedInvite) return;
  try {
    const inviteRes = await api.get(`/api/trainers/invite/${storedInvite}`);
    const trainerId = inviteRes.data.trainer.id;
    await createConnection(trainerId);
  } catch {
    // convite pode ter expirado ou já ter sido usado — ignora
  } finally {
    localStorage.removeItem('@ptrainr:invite');
  }
}

export function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'unverified'>(
    searchParams.get('oauth_error') ? 'error' : 'idle',
  );
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent'>('idle');

  const [tempToken, setTempToken] = useState<string | null>(
    (location.state as { tempToken?: string } | null)?.tempToken ?? null,
  );
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorStatus, setTwoFactorStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    const token = window.localStorage.getItem('personaltrainr.token');
    const userRaw = window.localStorage.getItem('personaltrainr.user');
    if (!token || !userRaw) return;
    try {
      const user = JSON.parse(userRaw);
      navigate(routeForRole(user.role), { replace: true });
    } catch {
      window.localStorage.removeItem('personaltrainr.token');
      window.localStorage.removeItem('personaltrainr.user');
    }
  }, [navigate]);

  async function finishLogin(session: { token: string; user: UserData }) {
    window.localStorage.setItem('personaltrainr.token', session.token);
    window.localStorage.setItem('personaltrainr.user', JSON.stringify(session.user));

    if (session.user.role === 'ALUNO') {
      await completePendingInvite();
    }

    if (session.user.requiresTwoFactorSetup) {
      navigate('/configurar-2fa', { replace: true, state: { forced: true } });
      return;
    }

    navigate(routeForRole(session.user.role), { replace: true });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');

    try {
      const session = await login({ email, password });

      if ('requiresTwoFactor' in session) {
        setTempToken(session.tempToken);
        setStatus('idle');
        return;
      }

      await finishLogin(session);
    } catch (err: unknown) {
      const status = err instanceof AxiosError ? err.response?.status : undefined;
      if (status === 403 && err instanceof AxiosError && String(err.response?.data?.message ?? '').includes('Confirme seu e-mail')) {
        setStatus('unverified');
        return;
      }
      setStatus('error');
    }
  }

  async function handleVerifyTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tempToken) return;
    setTwoFactorStatus('loading');

    try {
      const session = await verifyTwoFactor(tempToken, twoFactorCode);
      await finishLogin(session);
    } catch {
      setTwoFactorStatus('error');
    }
  }

  async function handleResendVerification() {
    setResendStatus('loading');
    try {
      await resendVerification(email);
      setResendStatus('sent');
    } catch {
      setResendStatus('idle');
    }
  }

  if (tempToken) {
    return (
      <main className="grid min-h-screen place-items-center bg-base px-5 font-body">
        <div className="w-full max-w-md">
          <form onSubmit={handleVerifyTwoFactor} className="rounded-2xl bg-card p-8">
            <h1 className="font-title text-2xl uppercase tracking-wider text-text-primary">
              Verificação em duas etapas
            </h1>

            <p className="mt-4 text-sm text-text-secondary">
              Digite o código de 6 dígitos do seu app autenticador, ou um código de backup.
            </p>

            <label className="mt-6 block space-y-2">
              <span className="text-xs uppercase text-text-secondary">Código</span>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.trim())}
                className="h-12 w-full rounded-lg border border-border bg-base px-3 text-center text-lg tracking-widest text-text-primary outline-none focus:border-accent"
                required
              />
            </label>

            {twoFactorStatus === 'error' && (
              <p role="alert" className="mt-5 rounded-lg border border-border px-4 py-3 text-sm text-accent">
                Código inválido. Tente novamente.
              </p>
            )}

            <button
              type="submit"
              disabled={twoFactorStatus === 'loading'}
              className="mt-6 block min-h-12 w-full rounded-lg bg-accent px-5 font-bold uppercase text-black transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
            >
              {twoFactorStatus === 'loading' ? 'Verificando...' : 'Confirmar'}
            </button>

            <button
              type="button"
              onClick={() => setTempToken(null)}
              className="mt-4 block w-full text-center text-xs uppercase text-text-secondary underline transition hover:opacity-80"
            >
              Voltar para o login
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-base px-5 font-body">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-card p-8"
        >
          <Link
            to="/"
            className="mb-6 inline-block text-xs uppercase text-accent transition hover:opacity-80"
          >
            &larr; Voltar para Home
          </Link>

          <h1 className="font-title text-3xl uppercase tracking-wider text-text-primary">
            Personal Trainr
          </h1>

          <div className="mt-8 space-y-5">
            <label className="block space-y-2">
              <span className="text-xs uppercase text-text-secondary">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-lg border border-border bg-base px-3 text-text-primary outline-none focus:border-accent"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs uppercase text-text-secondary">Senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-lg border border-border bg-base px-3 text-text-primary outline-none focus:border-accent"
                required
              />
            </label>

            <Link
              to="/esqueci-senha"
              className="block text-right text-xs text-accent underline transition hover:opacity-80"
            >
              Esqueci minha senha
            </Link>
          </div>

          {status === 'error' && (
            <p role="alert" className="mt-5 rounded-lg border border-border px-4 py-3 text-sm text-accent">
              Não foi possível autenticar com essas credenciais.
            </p>
          )}

          {status === 'unverified' && (
            <div role="alert" className="mt-5 space-y-3 rounded-lg border border-border px-4 py-3 text-sm text-accent">
              <p>Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.</p>
              {resendStatus === 'sent' ? (
                <p className="text-text-secondary">Email reenviado. Verifique sua caixa de entrada (e spam).</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendStatus === 'loading'}
                  className="text-xs uppercase underline transition hover:opacity-80 disabled:opacity-70"
                >
                  {resendStatus === 'loading' ? 'Enviando...' : 'Reenviar e-mail de confirmação'}
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="mt-6 block min-h-12 w-full rounded-lg bg-accent px-5 font-bold uppercase text-black transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
          >
            {status === 'loading' ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase text-text-secondary">ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-base px-5 font-bold uppercase text-text-primary transition hover:border-accent active:scale-98"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
              <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.63H1.29A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.29 5.37l3.98-3.09z" />
              <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.63l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
            </svg>
            Continuar com Google
          </button>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="text-accent underline transition hover:opacity-80">
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
