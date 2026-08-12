import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Dumbbell, Link2, ClipboardList, CreditCard } from 'lucide-react';
import { getOverview, getWorkoutStats, type AdminOverview, type AdminWorkoutStats } from '../../api/admin';

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#333333] ${className ?? ''}`} />;
}

const PLAN_LABELS: Record<string, string> = { FREE: 'Grátis', PRO: 'Pro', UNLIMITED: 'Ilimitado' };
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativa',
  PAST_DUE: 'Em atraso',
  CANCELED: 'Cancelada',
  INCOMPLETE: 'Incompleta',
};

export function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [workoutStats, setWorkoutStats] = useState<AdminWorkoutStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOverview(), getWorkoutStats()])
      .then(([o, w]) => {
        setOverview(o);
        setWorkoutStats(w);
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = overview
    ? [
        { label: 'Usuários Totais', value: overview.users.total, icon: Users },
        { label: 'Personal Trainers', value: overview.users.trainers, icon: UserCheck },
        { label: 'Alunos', value: overview.users.students, icon: Users },
        { label: 'Contas Inativas', value: overview.users.inactive, icon: UserX },
      ]
    : [];

  const workoutCards = workoutStats
    ? [
        { label: 'Conexões Ativas', value: workoutStats.connections, icon: Link2 },
        { label: 'Rotinas Criadas', value: workoutStats.routines, icon: ClipboardList },
        { label: 'Exercícios Globais', value: workoutStats.globalExercises, icon: Dumbbell },
        { label: 'Atribuições Ativas', value: workoutStats.activeAssignments, icon: ClipboardList },
      ]
    : [];

  return (
    <section className="mx-auto max-w-7xl">
      <div>
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-accent">PAINEL ADMIN</span>
        <h1 className="mt-2 font-title text-4xl uppercase text-white sm:text-5xl">Visão Geral</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-text-secondary">
          Métricas gerais da plataforma.
        </p>
      </div>

      {loading ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((m) => {
              const Icon = m.icon;
              return (
                <article
                  key={m.label}
                  className="group rounded-xl border border-transparent bg-card p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-accent/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-text-secondary">{m.label}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                      <Icon size={15} />
                    </span>
                  </div>
                  <p className="mt-4 font-number text-5xl font-bold text-white">{m.value}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {workoutCards.map((m) => {
              const Icon = m.icon;
              return (
                <article
                  key={m.label}
                  className="group rounded-xl border border-transparent bg-card p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-accent/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-text-secondary">{m.label}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                      <Icon size={15} />
                    </span>
                  </div>
                  <p className="mt-4 font-number text-5xl font-bold text-white">{m.value}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-card p-6">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-accent" />
                <h2 className="font-title text-xl uppercase text-white">Planos</h2>
              </div>
              <div className="mt-4 space-y-3">
                {overview?.plans.length ? (
                  overview.plans.map((p) => (
                    <div key={p.plan} className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">{PLAN_LABELS[p.plan] ?? p.plan}</span>
                      <span className="font-number text-lg font-bold text-accent">{p.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-secondary">Nenhuma assinatura ainda.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-card p-6">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-accent" />
                <h2 className="font-title text-xl uppercase text-white">Status de Assinaturas</h2>
              </div>
              <div className="mt-4 space-y-3">
                {overview?.subscriptionStatus.length ? (
                  overview.subscriptionStatus.map((s) => (
                    <div key={s.status} className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">{STATUS_LABELS[s.status] ?? s.status}</span>
                      <span className="font-number text-lg font-bold text-accent">{s.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-secondary">Nenhuma assinatura ainda.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
