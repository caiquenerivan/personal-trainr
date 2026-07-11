import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { register, login } from '../api/auth';
import { api } from '../api/client';
import { createConnection } from '../api/connections';

export function RegisterPage() {
  const navigate = useNavigate();
  const [inviteUsername, setInviteUsername] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'TRAINER' | 'ALUNO'>('ALUNO');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('@ptrainr:invite');
    if (stored) setInviteUsername(stored);
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);

    try {
      await register({ name, email, password, role, username: username || undefined });

      const storedInvite = localStorage.getItem('@ptrainr:invite');

      if (storedInvite && role === 'ALUNO') {
        const session = await login({ email, password });
        localStorage.setItem('personaltrainr.token', session.token);
        localStorage.setItem('personaltrainr.user', JSON.stringify(session.user));

        const inviteRes = await api.get(`/api/trainers/invite/${storedInvite}`);
        const trainerId = inviteRes.data.trainer.id;
        await createConnection(trainerId);

        localStorage.removeItem('@ptrainr:invite');
        navigate('/aluno/painel', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof AxiosError
          ? String(err.response?.data?.message ?? '')
          : '';
      setError(msg || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
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
            className="inline-block text-xs uppercase text-accent transition hover:opacity-80"
          >
            &larr; Voltar para Home
          </Link>

          {inviteUsername && (
            <p className="mt-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-center text-xs text-accent">
              Você está se cadastrando a convite de <span className="font-bold">@{inviteUsername}</span>
            </p>
          )}

          <h1 className="mt-6 font-title text-3xl uppercase tracking-wider text-text-primary">
            Criar Conta
          </h1>

          <div className="mt-8 space-y-5">
            <label className="block space-y-2">
              <span className="text-xs uppercase text-text-secondary">Nome</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 w-full rounded-lg border border-border bg-base px-3 text-text-primary outline-none focus:border-accent"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs uppercase text-text-secondary">Nome de Usuário</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                  className="h-12 w-full rounded-lg border border-border bg-base pl-8 pr-3 text-text-primary outline-none focus:border-accent"
                  placeholder="username"
                />
              </div>
            </label>

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
                minLength={6}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs uppercase text-text-secondary">Repetir Senha</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`h-12 w-full rounded-lg border bg-base px-3 text-text-primary outline-none focus:border-accent ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500'
                    : 'border-border'
                }`}
                minLength={6}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400">As senhas não conferem.</p>
              )}
            </label>

            <label className="block space-y-2">
              <span className="text-xs uppercase text-text-secondary">
                Tipo de Conta
              </span>
              <div className="flex gap-4">
                <label
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-4 py-3 transition ${
                    role === 'ALUNO'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-base text-text-secondary'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="ALUNO"
                    checked={role === 'ALUNO'}
                    onChange={() => setRole('ALUNO')}
                    className="sr-only"
                  />
                  <span className="text-sm font-bold uppercase">Aluno</span>
                </label>
                <label
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-4 py-3 transition ${
                    role === 'TRAINER'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-base text-text-secondary'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="TRAINER"
                    checked={role === 'TRAINER'}
                    onChange={() => setRole('TRAINER')}
                    className="sr-only"
                  />
                  <span className="text-sm font-bold uppercase">Personal</span>
                </label>
              </div>
            </label>
          </div>

          {error && (
            <p role="alert" className="mt-5 rounded-lg border border-border px-4 py-3 text-sm text-accent">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 block min-h-12 w-full rounded-lg bg-accent px-5 font-bold uppercase text-black transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </button>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-accent underline transition hover:opacity-80">
              Faça Login
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
