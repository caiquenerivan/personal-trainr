import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { register } from '../api/auth';

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'TRAINER' | 'ALUNO'>('ALUNO');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);

    try {
      await register({ name, email, password, role });
      navigate('/login', { replace: true });
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
            className="mb-6 inline-block text-xs uppercase text-accent transition hover:opacity-80"
          >
            &larr; Voltar para Home
          </Link>

          <h1 className="font-title text-3xl uppercase tracking-wider text-text-primary">
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
