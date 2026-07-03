import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { getMyRoutine } from '../api/student';

type RoutineData = {
  id: string;
  name: string;
  type: string;
  trainerId: string;
  expiresAt: string;
  assignedAt: string;
  createdAt: string;
  exercises: Record<string, any[]>;
};

export function StudentDashboardPage() {
  const navigate = useNavigate();
  const [routine, setRoutine] = useState<RoutineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  let user: Record<string, any> | null = null;
  try {
    const userRaw = window.localStorage.getItem('personaltrainr.user');
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch {
    user = null;
  }

  useEffect(() => {
    getMyRoutine()
      .then((data) => {
        setRoutine(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Nenhuma rotina ativa encontrada.');
        setLoading(false);
      });
  }, []);

  function getDaysRemaining(expiresAt: string) {
    const now = new Date();
    const exp = new Date(expiresAt);
    const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  return (
    <section className="mx-auto max-w-7xl">
      <h1 className="font-title text-3xl uppercase text-text-primary">
        Olá, {user?.name?.split(' ')[0] ?? 'Aluno'}!
      </h1>

      {loading && (
        <p className="mt-8 font-body text-text-secondary">Carregando sua rotina...</p>
      )}

      {error && !loading && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <p className="font-body text-text-secondary">{error}</p>
          <p className="mt-2 text-sm text-text-secondary">
            Consulte seu personal trainer para vincular uma rotina.
          </p>
        </div>
      )}

      {routine && !loading && (
        <>
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-title text-xl uppercase tracking-wide text-text-primary">
              Rotina Ativa
            </h2>

            <div className="mt-4 space-y-3">
              <p className="font-body text-text-primary">
                <span className="text-text-secondary">Treino:</span>{' '}
                <strong className="text-accent">{routine.name}</strong>
              </p>
              <p className="font-body text-text-primary">
                <span className="text-text-secondary">Divisão:</span>{' '}
                <strong className="text-accent">{routine.type}</strong>
              </p>
              <p className="font-body text-text-primary">
                <span className="text-text-secondary">Dias restantes:</span>{' '}
                <strong className="font-number text-2xl text-accent">
                  {getDaysRemaining(routine.expiresAt)}
                </strong>
                <span className="ml-1 text-text-secondary">dias</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/aluno/treino-hoje')}
              className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-accent px-8 py-4 font-bold uppercase text-black transition hover:opacity-90"
            >
              <Play size={22} />
              Iniciar Treino de Hoje
            </button>
          </div>
        </>
      )}
    </section>
  );
}
