import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { resendVerification } from '../api/auth';

export function CheckEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? '';
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle');
  const [error, setError] = useState('');

  if (!email) {
    navigate('/login', { replace: true });
    return null;
  }

  async function handleResend() {
    setError('');
    setStatus('loading');
    try {
      await resendVerification(email);
      setStatus('sent');
    } catch (err: unknown) {
      const msg =
        err instanceof AxiosError
          ? String(err.response?.data?.message ?? '')
          : '';
      setStatus('idle');
      setError(msg || 'Erro ao reenviar email. Tente novamente.');
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-base px-5 font-body">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-card p-8 text-center">
          <h1 className="font-title text-2xl uppercase tracking-wider text-text-primary">
            Confirme seu e-mail
          </h1>

          <p className="mt-6 text-sm text-text-secondary">
            Enviamos um link de confirmação para <span className="font-bold text-text-primary">{email}</span>.
            Clique no link para ativar sua conta e poder fazer login.
          </p>

          {status === 'sent' && (
            <p className="mt-5 rounded-lg border border-border px-4 py-3 text-sm text-text-secondary">
              Email reenviado. Verifique sua caixa de entrada (e spam).
            </p>
          )}

          {error && (
            <p role="alert" className="mt-5 rounded-lg border border-border px-4 py-3 text-sm text-accent">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleResend}
            disabled={status === 'loading'}
            className="mt-6 block min-h-12 w-full rounded-lg bg-accent px-5 font-bold uppercase text-black transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
          >
            {status === 'loading' ? 'Enviando...' : 'Reenviar e-mail'}
          </button>

          <p className="mt-6 text-center text-sm text-text-secondary">
            <Link to="/login" className="text-accent underline transition hover:opacity-80">
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
