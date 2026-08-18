import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { verifyEmail } from '../api/auth';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Link inválido.');
      return;
    }

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        const msg =
          err instanceof AxiosError
            ? String(err.response?.data?.message ?? '')
            : '';
        setStatus('error');
        setError(msg || 'Não foi possível confirmar seu e-mail.');
      });
  }, [token]);

  return (
    <main className="grid min-h-screen place-items-center bg-base px-5 font-body">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-card p-8 text-center">
          <h1 className="font-title text-2xl uppercase tracking-wider text-text-primary">
            Confirmação de e-mail
          </h1>

          {status === 'loading' && (
            <p className="mt-6 text-sm text-text-secondary">Confirmando seu e-mail...</p>
          )}

          {status === 'success' && (
            <>
              <p className="mt-6 rounded-lg border border-border px-4 py-3 text-sm text-text-secondary">
                E-mail confirmado com sucesso! Você já pode fazer login.
              </p>
              <Link
                to="/login"
                className="mt-6 block min-h-12 rounded-lg bg-accent px-5 py-3 font-bold uppercase leading-6 text-black transition hover:opacity-90"
              >
                Ir para o login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <p role="alert" className="mt-6 rounded-lg border border-border px-4 py-3 text-sm text-accent">
                {error}
              </p>
              <p className="mt-6 text-center text-sm text-text-secondary">
                <Link to="/login" className="text-accent underline transition hover:opacity-80">
                  Voltar para o login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
