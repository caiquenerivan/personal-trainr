import { useEffect, useState } from 'react';
import {
  Target,
  Flame,
  CalendarDays,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { getStudentsProgress, type StudentProgress } from '../api/connections';
import { DonutProgress } from '../components/DonutProgress';

/* ─── Helpers ───────────────────────────────────────── */
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function getAdhesionInfo(rate: number) {
  if (rate >= 75) return { color: '#AF9150', label: 'Excelente adesão' };
  if (rate >= 50) return { color: '#D4B872', label: 'Boa adesão' };
  if (rate >= 30) return { color: '#F97316', label: 'Atenção necessária' };
  return { color: '#DC2626', label: 'Risco de abandono' };
}

/* ─── Skeleton ──────────────────────────────────────── */
function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#333333] ${className ?? ''}`} />;
}

function ProgressSkeleton() {
  return (
    <section className="mx-auto max-w-7xl">
      <div className="space-y-3">
        <SkeletonBlock className="h-3 w-56" />
        <SkeletonBlock className="h-10 w-80" />
        <SkeletonBlock className="h-4 w-96" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[#262626] p-6 space-y-6">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-3 w-20" />
              </div>
              <SkeletonBlock className="h-6 w-16 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="rounded-lg bg-[#333333] p-3 space-y-2">
                  <SkeletonBlock className="h-2 w-16" />
                  <SkeletonBlock className="h-5 w-12" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <SkeletonBlock className="h-20 w-20 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Empty State ───────────────────────────────────── */
function EmptyState() {
  return (
    <section className="mx-auto max-w-7xl">
      <div className="space-y-3">
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#AF9150]">
          PROGRESSO DOS ALUNOS
        </span>
        <h1 className="font-title text-5xl uppercase text-white">
          ENGAJAMENTO E DESEMPENHO
        </h1>
      </div>

      <div className="mt-16 flex flex-col items-center justify-center rounded-xl bg-[#262626] py-16">
        <TrendingUp size={48} className="text-[#4A4A4A]" />
        <p className="mt-4 text-sm text-[#A7A7A7]">
          Nenhum aluno conectado ainda.
        </p>
        <p className="mt-1 text-xs text-[#666]">
          Convide alunos para começar a acompanhar o progresso deles.
        </p>
      </div>
    </section>
  );
}

/* ─── Component ─────────────────────────────────────── */
export function ProgressPage() {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentsProgress()
      .then((res) => setStudents(res.students))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ProgressSkeleton />;
  if (students.length === 0) return <EmptyState />;

  return (
    <section className="mx-auto max-w-7xl">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#AF9150]">
            PROGRESSO DOS ALUNOS
          </span>
          <h1 className="mt-2 font-title text-5xl uppercase text-white">
            ENGAJAMENTO E DESEMPENHO
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#A7A7A7]">
            Acompanhe a frequência, adesão e evolução de cada aluno vinculado ao seu plano de treinamento.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 self-start rounded-lg border border-[#4A4A4A] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#F4F4F4] transition-all hover:border-[#AF9150] hover:text-[#AF9150] sm:self-auto"
        >
          <Filter size={14} />
          Filtrar
        </button>
      </div>

      {/* ─── Students Grid ──────────────────────────────── */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {students.map((student) => {
          const adhesion = getAdhesionInfo(student.adhesionRate);

          return (
            <article
              key={student.id}
              className="flex flex-col rounded-xl border border-transparent bg-[#262626] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-[#AF9150]/50 hover:shadow-[0_0_28px_rgba(175,145,80,0.3)]"
            >
              {/* ── Card Header: Avatar + Name + Badge ── */}
              <div className="flex items-center gap-3">
                {student.avatarUrl ? (
                  <img
                    src={student.avatarUrl}
                    alt={student.name}
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#333333] text-sm font-bold text-[#AF9150]">
                    {getInitials(student.name)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {student.name}
                  </p>
                  <p className="truncate text-xs text-[#A7A7A7]">
                    @{student.username ?? '---'}
                  </p>
                </div>

                {/* Status Badge */}
                <span
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                    student.connectionStatus === 'ACTIVE'
                      ? 'border-[#4A4A4A] bg-[#333333] text-white'
                      : 'border-[#4A4A4A] bg-[#333333] text-[#666]'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      student.connectionStatus === 'ACTIVE'
                        ? 'bg-[#AF9150]'
                        : 'bg-[#666]'
                    }`}
                  />
                  {student.connectionStatus === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {/* ── Mini-Metrics Grid ── */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[#333333] p-3">
                  <div className="flex items-center gap-1.5">
                    <Target size={12} className="text-[#A7A7A7]" />
                    <span className="text-[10px] font-semibold uppercase text-[#A7A7A7]">
                      Frequência
                    </span>
                  </div>
                  <p className="mt-1.5 font-number text-lg font-bold text-white">
                    {student.weeklyGoal}x
                    <span className="text-xs font-normal text-[#A7A7A7]"> / semana</span>
                  </p>
                </div>

                <div className="rounded-lg bg-[#333333] p-3">
                  <div className="flex items-center gap-1.5">
                    <Flame size={12} className="text-[#A7A7A7]" />
                    <span className="text-[10px] font-semibold uppercase text-[#A7A7A7]">
                      Streak
                    </span>
                  </div>
                  <p className="mt-1.5 font-number text-lg font-bold text-white">
                    {student.weeklyStreak}
                    <span className="text-xs font-normal text-[#A7A7A7]">
                      {' '}{student.weeklyStreak === 1 ? 'semana' : 'semanas'}
                    </span>
                  </p>
                </div>

                <div className="rounded-lg bg-[#333333] p-3">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={12} className="text-[#A7A7A7]" />
                    <span className="text-[10px] font-semibold uppercase text-[#A7A7A7]">
                      Últimos 7 dias
                    </span>
                  </div>
                  <p className="mt-1.5 font-number text-lg font-bold text-white">
                    {student.workoutsLast7Days}
                    <span className="text-xs font-normal text-[#A7A7A7]">
                      {' '}{student.workoutsLast7Days === 1 ? 'treino' : 'treinos'}
                    </span>
                  </p>
                </div>

                <div className="rounded-lg bg-[#333333] p-3">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-[#A7A7A7]" />
                    <span className="text-[10px] font-semibold uppercase text-[#A7A7A7]">
                      Adesão
                    </span>
                  </div>
                  <p
                    className="mt-1.5 font-number text-lg font-bold"
                    style={{ color: adhesion.color }}
                  >
                    {student.adhesionRate}%
                  </p>
                </div>
              </div>

              {/* ── Donut Chart + Adhesion Info ── */}
              <div className="mt-6 flex items-center gap-4">
                <DonutProgress
                  percentage={student.adhesionRate}
                  color={adhesion.color}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{adhesion.label}</p>
                  <p className="mt-0.5 text-xs text-[#A7A7A7]">
                    {student.adhesionRate >= 75
                      ? 'Aluno comprometido com a rotina.'
                      : student.adhesionRate >= 50
                        ? 'Bom ritmo, pode melhorar.'
                        : student.adhesionRate >= 30
                          ? 'Precisa de incentivo.'
                          : 'Risco alto de desistencia.'}
                  </p>
                </div>
              </div>

              {/* ── Footer: VER DETALHES ── */}
              <button
                type="button"
                className="mt-6 w-full rounded-lg border border-[#4A4A4A] bg-transparent py-2.5 text-xs font-semibold uppercase tracking-wider text-[#A7A7A7] transition-all hover:border-[#AF9150] hover:text-[#AF9150]"
              >
                Ver Detalhes
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
