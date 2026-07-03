import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { login } from '../api/auth';

export function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    const token = window.localStorage.getItem('personaltrainr.token');
    const userRaw = window.localStorage.getItem('personaltrainr.user');
    if (!token || !userRaw) return;
    try {
      const user = JSON.parse(userRaw);
      navigate(user.role === 'ALUNO' ? '/aluno/painel' : '/painel', { replace: true });
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
        navigate('/aluno/painel', { replace: true });
      } else {
        navigate('/painel', { replace: true });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof AxiosError
          ? String(err.response?.data?.message ?? '')
          : '';
      setStatus('error');
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
          </div>

          {status === 'error' && (
            <p role="alert" className="mt-5 rounded-lg border border-border px-4 py-3 text-sm text-accent">
              Não foi possível autenticar com essas credenciais.
            </p>
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
