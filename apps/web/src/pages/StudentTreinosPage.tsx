import { useEffect, useState } from 'react';
import { getMyAssignments, type RoutineAssignmentSummary } from '../api/student';

export function StudentTreinosPage() {
  const [assignments, setAssignments] = useState<RoutineAssignmentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAssignments()
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl">
        <p className="font-body text-text-secondary">Carregando treinos...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl">
      <h1 className="font-title text-3xl uppercase text-text-primary">MEUS TREINOS</h1>

      {assignments.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_28px_rgba(175,145,80,0.3)]">
          <p className="font-body text-text-secondary">
            Nenhum treino vinculado ainda. Consulte seu personal trainer.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-border bg-card p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_28px_rgba(175,145,80,0.3)]"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-title text-lg uppercase tracking-wide text-text-primary">
                  {a.routineName}
                </h2>
                {a.isActive ? (
                  <span className="rounded-full bg-green-900/30 px-3 py-1 text-xs text-green-400">
                    ● Ativa
                  </span>
                ) : (
                  <span className="rounded-full bg-base px-3 py-1 text-xs text-text-secondary">
                    Histórico
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-1 text-sm text-text-secondary">
                <p>
                  Vinculado em:{' '}
                  {new Date(a.assignedAt).toLocaleDateString('pt-BR')}
                </p>
                <p>
                  Expira em:{' '}
                  {new Date(a.expiresAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
