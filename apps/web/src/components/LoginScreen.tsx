import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { login, resendVerification, type UserData } from '../api/auth';
import { api } from '../api/client';
import { createConnection } from '../api/connections';

function routeForRole(role: UserData['role']): string {
  if (role === 'ALUNO') return '/aluno/painel';
  if (role === 'ADMIN') return '/admin';
  return '/painel';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'unverified'>('idle');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent'>('idle');

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');

    try {
      const session = await login({ email, password });
      window.localStorage.setItem('personaltrainr.token', session.token);
      window.localStorage.setItem('personaltrainr.user', JSON.stringify(session.user));

      if (session.user.role === 'ALUNO') {
        await completePendingInvite();
      }

      navigate(routeForRole(session.user.role), { replace: true });
    } catch (err: unknown) {
      const status = err instanceof AxiosError ? err.response?.status : undefined;
      if (status === 403 && err instanceof AxiosError && String(err.response?.data?.message ?? '').includes('Confirme seu e-mail')) {
        setStatus('unverified');
        return;
      }
      setStatus('error');
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
