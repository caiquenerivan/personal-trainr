import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { api } from '../api/client';
import { clearUserData } from '../utils/userStorage';

const CONFIRMATION = 'EXCLUIR';

// Página pública de exclusão de conta. A Google Play exige um link onde o
// usuário consiga pedir a exclusão fora do app; logado, a exclusão é feita
// aqui mesmo, com a mesma rota que o app usa.
export function DeleteAccountPage() {
  const navigate = useNavigate();
  const loggedIn = !!window.localStorage.getItem('personaltrainr.token');
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setError(null);
    try {
      await api.post('/api/users/me/delete', { confirmation, password: password || undefined });
      clearUserData();
      window.localStorage.removeItem('personaltrainr.token');
      window.localStorage.removeItem('personaltrainr.user');
      setStatus('done');
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.message : null;
      setError(message || 'Não foi possível excluir a conta.');
      setStatus('idle');
    }
  }

  return (
    <main className="min-h-screen bg-base px-5 py-12 font-body text-text-primary">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-xs uppercase text-accent transition hover:opacity-80">
          &larr; Voltar para Home
        </Link>

        <h1 className="mt-6 font-title text-3xl uppercase tracking-wider text-text-primary">Excluir conta</h1>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-text-secondary">
          <p>
            Você pode excluir sua conta do <strong className="text-text-primary">Personal Trainr</strong> a qualquer
            momento, pelo app (Perfil &rarr; Excluir conta) ou por esta página. A exclusão é permanente e apaga:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>seus dados de cadastro e perfil, incluindo a foto;</li>
            <li>seu histórico de treinos e de cargas;</li>
            <li>seus vínculos entre personal e aluno e as avaliações;</li>
            <li>para personal trainers: rotinas e exercícios criados, e a assinatura, que é cancelada.</li>
          </ul>
          <p>Nenhum dado da conta é mantido após a exclusão.</p>
        </div>

        {status === 'done' ? (
          <div className="mt-8 rounded-2xl bg-card p-6">
            <p className="text-text-primary">Sua conta foi excluída.</p>
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="mt-4 rounded-lg border border-border px-5 py-2 text-sm uppercase text-text-secondary transition hover:bg-base"
            >
              Ir para o início
            </button>
          </div>
        ) : loggedIn ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl bg-card p-6">
            <label className="block space-y-2">
              <span className="text-xs uppercase text-text-secondary">Digite {CONFIRMATION} para confirmar</span>
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoCapitalize="characters"
                autoComplete="off"
                className="h-12 w-full rounded-lg border border-border bg-base px-3 text-text-primary outline-none focus:border-accent"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs uppercase text-text-secondary">Sua senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Se você entra com Google, deixe em branco"
                className="h-12 w-full rounded-lg border border-border bg-base px-3 text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-accent"
              />
            </label>
            {error && (
              <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={confirmation.trim().toUpperCase() !== CONFIRMATION || status === 'loading'}
              className="block min-h-12 w-full rounded-lg bg-red-600 px-5 font-bold uppercase text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'loading' ? 'Excluindo...' : 'Excluir minha conta'}
            </button>
          </form>
        ) : (
          <div className="mt-8 rounded-2xl bg-card p-6 text-sm text-text-secondary">
            <p>Para excluir, entre na sua conta e volte a esta página, ou use o app em Perfil &rarr; Excluir conta.</p>
            <Link
              to="/login"
              className="mt-4 inline-block rounded-lg bg-accent px-5 py-3 font-bold uppercase text-black transition hover:opacity-90"
            >
              Entrar
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
