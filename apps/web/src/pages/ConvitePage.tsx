import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { api } from '../api/client';
import { createConnection } from '../api/connections';

type TrainerData = {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
};

export function ConvitePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [trainer, setTrainer] = useState<TrainerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  useEffect(() => {
    if (!username) {
      setError('Link inválido');
      setLoading(false);
      return;
    }

    api
      .get(`/api/trainers/invite/${username}`)
      .then((res) => setTrainer(res.data.trainer))
      .catch((err: unknown) => {
        const msg =
          err instanceof AxiosError
            ? err.response?.data?.message || 'Personal não encontrado'
            : 'Erro ao carregar';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [username]);

  const isLoggedIn = !!localStorage.getItem('personaltrainr.token');

  function handleAccept() {
    if (!trainer || !username) return;

    if (!isLoggedIn) {
      localStorage.setItem('@ptrainr:invite', username);
      navigate('/', { replace: true });
      return;
    }

    setAccepting(true);
    setAcceptError('');
    createConnection(trainer.id)
      .then(() => navigate('/aluno/painel', { replace: true }))
      .catch((err: unknown) => {
        const msg =
          err instanceof AxiosError
            ? err.response?.data?.message || 'Erro ao aceitar convite'
            : 'Erro ao aceitar convite';
        setAcceptError(msg);
      })
      .finally(() => setAccepting(false));
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base">
        <p className="font-body text-sm text-text-secondary">Carregando...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base px-5">
        <div className="w-full max-w-md text-center">
          <p className="font-body text-text-secondary">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 rounded-lg bg-accent px-6 py-3 font-bold uppercase text-black transition hover:opacity-90"
          >
            Voltar para Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-5">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="rounded-2xl border border-white/10 bg-card p-8 text-center shadow-[0_0_40px_rgba(175,145,80,0.25)]">
          <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-accent bg-base">
            {trainer?.avatarUrl ? (
              <img
                src={trainer.avatarUrl}
                alt={trainer?.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold uppercase text-accent">
                {trainer?.name.charAt(0)}
              </span>
            )}
          </div>

          <h1 className="mt-6 font-title text-2xl uppercase tracking-wider text-text-primary">
            {trainer?.name} convidou você para treinar!
          </h1>

          {trainer?.bio && (
            <p className="mt-4 font-body text-sm leading-relaxed text-text-secondary">
              {trainer.bio}
            </p>
          )}

          {acceptError && (
            <p className="mt-5 rounded-lg border border-border px-4 py-3 text-sm text-accent">
              {acceptError}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 rounded-xl bg-accent px-6 py-4 font-body text-sm font-bold uppercase text-black transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70 active:scale-[0.98]"
            >
              {accepting ? 'Aceitando...' : isLoggedIn ? 'Aceitar Convite' : 'Conhecer Plataforma e Aceitar'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 rounded-xl border border-border bg-base px-6 py-4 font-body text-sm font-bold uppercase text-text-secondary transition hover:bg-white/5 active:scale-[0.98]"
            >
              Recusar
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
