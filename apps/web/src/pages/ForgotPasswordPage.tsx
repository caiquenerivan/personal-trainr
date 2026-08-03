import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    try {
      await forgotPassword(email);
    } finally {
      setStatus('sent');
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
            Esqueci minha senha
          </h1>

          {status === 'sent' ? (
            <p className="mt-6 rounded-lg border border-border px-4 py-3 text-sm text-text-secondary">
              Se o email existir em nossa base, enviamos um link de redefinição de senha para ele.
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm text-text-secondary">
                Informe seu email cadastrado e enviaremos um link para redefinir sua senha.
              </p>

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
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="mt-6 block min-h-12 w-full rounded-lg bg-accent px-5 font-bold uppercase text-black transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
              >
                {status === 'loading' ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
