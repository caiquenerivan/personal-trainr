import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { resetPassword } from '../api/auth';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('Link inválido. Solicite uma nova redefinição de senha.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setStatus('loading');
    try {
      await resetPassword(token, newPassword);
      setStatus('success');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err: unknown) {
      const msg =
        err instanceof AxiosError
          ? String(err.response?.data?.message ?? '')
          : '';
      setStatus('idle');
      setError(msg || 'Erro ao redefinir senha. Tente novamente.');
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-base px-5 font-body">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="rounded-2xl bg-card p-8">
          <Link
            to="/login"
            className="mb-6 inline-block text-xs uppercase text-accent transition hover:opacity-80"
          >
            &larr; Voltar para Login
          </Link>

          <h1 className="font-title text-2xl uppercase tracking-wider text-text-primary">
            Redefinir senha
          </h1>

          {status === 'success' ? (
            <p className="mt-6 rounded-lg border border-border px-4 py-3 text-sm text-text-secondary">
              Senha redefinida com sucesso. Redirecionando para o login...
            </p>
          ) : (
            <>
              <div className="mt-8 space-y-5">
                <label className="block space-y-2">
                  <span className="text-xs uppercase text-text-secondary">Nova senha</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 w-full rounded-lg border border-border bg-base px-3 text-text-primary outline-none focus:border-accent"
                    minLength={6}
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs uppercase text-text-secondary">Confirmar nova senha</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 w-full rounded-lg border border-border bg-base px-3 text-text-primary outline-none focus:border-accent"
                    minLength={6}
                    required
                  />
                </label>
              </div>

              {error && (
                <p role="alert" className="mt-5 rounded-lg border border-border px-4 py-3 text-sm text-accent">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="mt-6 block min-h-12 w-full rounded-lg bg-accent px-5 font-bold uppercase text-black transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
              >
                {status === 'loading' ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
