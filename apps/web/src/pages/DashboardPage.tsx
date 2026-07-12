import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import {
  Users,
  Activity,
  Dumbbell,
  TrendingUp,
  ArrowUpRight,
  CheckCircle,
  Scale,
  ClipboardList,
} from 'lucide-react';
import { api } from '../api/client';

/* ─── Types ─────────────────────────────────────────── */
type DashboardData = {
  activeStudentsCount: number;
  workoutsLast7Days: number;
  routinesInUseCount: number;
  adhesionRate: number;
  activeStudentsList: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    routineName: string | null;
    connectedAt: string;
  }>;
  mostUsedRoutines: Array<{
    id: string;
    name: string;
    type: string | null;
    studentsUsing: number;
  }>;
  recentActivity: Array<{
    id: string;
    studentUsername: string;
    studentAvatar: string | null;
    routineName: string | null;
    workoutLetter: string | null;
    exerciseName: string | null;
    completedAt: string;
  }>;
};

/* ─── Helpers ───────────────────────────────────────── */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'BOM DIA';
  if (hour < 18) return 'BOA TARDE';
  return 'BOA NOITE';
}

function getStoredName(): string {
  try {
    const raw = window.localStorage.getItem('personaltrainr.user');
    if (raw) {
      const user = JSON.parse(raw);
      return user.name?.split(' ')[0] ?? '';
    }
  } catch {}
  return '';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
  } catch {
    return '';
  }
}

/* ─── Skeleton ──────────────────────────────────────── */
function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#333333] ${className ?? ''}`} />;
}

function DashboardSkeleton() {
  return (
    <section className="mx-auto max-w-7xl">
      {/* Header skeleton */}
      <div className="space-y-3">
        <SkeletonBlock className="h-3 w-48" />
        <SkeletonBlock className="h-10 w-72" />
        <SkeletonBlock className="h-4 w-96" />
      </div>

      {/* Metrics skeleton */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[#262626] p-6 space-y-4">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-10 w-16" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[#262626] p-6 space-y-4">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="h-3 w-28" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-3 w-32" />
                  <SkeletonBlock className="h-2 w-24" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Component ─────────────────────────────────────── */
export function DashboardPage() {
  const navigate = useNavigate();
  const greeting = useMemo(() => getGreeting(), []);
  const firstName = useMemo(() => getStoredName(), []);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardData>('/api/trainers/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const maxRoutineStudents = Math.max(
    1,
    ...data.mostUsedRoutines.map((r) => r.studentsUsing),
  );

  return (
    <section className="mx-auto max-w-7xl">
      {/* ─── Hero Header ──────────────────────────────────── */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#AF9150]">
            PAINEL DO PERSONAL
          </span>
          <h1 className="mt-2 font-title text-4xl uppercase text-white sm:text-5xl lg:text-6xl">
            {greeting}{firstName ? <><span className="font-body">,</span> {firstName}</> : ''}
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#A7A7A7]">
            Resumo dos seus alunos, atividade recente e rotinas mais usadas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/alunos')}
          className="hidden items-center gap-2 rounded-lg border border-[#505050] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#F4F4F4] transition-all hover:border-[#AF9150] hover:text-[#AF9150] sm:inline-flex"
        >
          Ver Alunos
          <ArrowUpRight size={14} />
        </button>
      </div>

      {/* ─── Metrics Grid ─────────────────────────────────── */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Alunos Ativos', value: data.activeStudentsCount, icon: Users, context: '' },
          { label: 'Treinos Concluídos', value: data.workoutsLast7Days, icon: Activity, context: 'últimos 7 dias' },
          { label: 'Rotinas em Uso', value: data.routinesInUseCount, icon: Dumbbell, context: `${data.routinesInUseCount} planos distintos` },
          { label: 'Adesão Média', value: `${data.adhesionRate}%`, icon: TrendingUp, context: '' },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <article
              key={m.label}
              className="group rounded-xl border border-transparent bg-[#262626] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-[#AF9150]/50 hover:shadow-[0_0_28px_rgba(175,145,80,0.3)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-[#A7A7A7]">{m.label}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#AF9150]/20 bg-[#AF9150]/10 text-[#AF9150] transition-colors group-hover:bg-[#AF9150]/15">
                  <Icon size={15} />
                </span>
              </div>
              <p className="mt-4 font-number text-5xl font-bold text-white">{m.value}</p>
              <p className="mt-2 text-sm text-[#A7A7A7]">{m.context}</p>
            </article>
          );
        })}
      </div>

      {/* ─── Listing Cards Grid ───────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">

        {/* ─── Card: Alunos Ativos ──────────────────────── */}
        <article className="rounded-xl border border-transparent bg-[#262626] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-[#AF9150]/50 hover:shadow-[0_0_28px_rgba(175,145,80,0.3)]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-title text-2xl uppercase text-white">Alunos Ativos</h2>
              <p className="mt-1 text-sm text-[#A7A7A7]">{data.activeStudentsCount} ativos agora</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/alunos')}
              className="text-sm font-bold text-[#AF9150] transition-colors hover:text-[#D4B060]"
            >
              VER TODOS
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {data.activeStudentsList?.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                {s.avatarUrl ? (
                  <img src={s.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#333333] text-xs font-bold text-[#AF9150]">
                    {getInitials(s.name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{s.name}</p>
                  <p className="truncate text-xs text-[#A7A7A7]">{s.routineName ?? 'Sem rotina'}</p>
                </div>
              </div>
            ))}
            {data.activeStudentsList?.length === 0 && (
              <p className="text-sm text-[#A7A7A7]">Nenhum aluno conectado.</p>
            )}
          </div>
        </article>

        {/* ─── Card: Atividade Recente ──────────────────── */}
        <article className="rounded-xl border border-transparent bg-[#262626] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-[#AF9150]/50 hover:shadow-[0_0_28px_rgba(175,145,80,0.3)]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-title text-2xl uppercase text-white">Atividade Recente</h2>
              <p className="mt-1 text-sm text-[#A7A7A7]">Últimas ações dos alunos</p>
            </div>
            <span className="text-sm font-bold text-[#AF9150]">TEMPO REAL</span>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {data.recentActivity?.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3">
                {/* Avatar with overlaid check icon */}
                <div className="relative shrink-0">
                  {ev.studentAvatar ? (
                    <img src={ev.studentAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#333333] text-xs font-bold text-[#AF9150]">
                      {getInitials(ev.studentUsername)}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-[#262626] bg-[#1a1a1a] text-[#AF9150]">
                    <CheckCircle size={10} />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold text-white">@{ev.studentUsername}</span>{' '}
                    <span className="text-[#A7A7A7]">concluiu exercício</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#AF9150]">
                    {ev.exerciseName}{ev.workoutLetter && ` - Treino ${ev.workoutLetter}`}
                  </p>
                  {ev.routineName && (
                    <p className="mt-0.5 truncate text-[10px] text-[#A7A7A7]">{ev.routineName}</p>
                  )}
                </div>

                <span className="shrink-0 pt-0.5 text-xs text-[#A7A7A7]">{timeAgo(ev.completedAt)}</span>
              </div>
            ))}
            {data.recentActivity?.length === 0 && (
              <p className="text-sm text-[#A7A7A7]">Nenhuma atividade recente.</p>
            )}
          </div>
        </article>

        {/* ─── Card: Rotinas Mais Usadas ────────────────── */}
        <article className="rounded-xl border border-transparent bg-[#262626] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-[#AF9150]/50 hover:shadow-[0_0_28px_rgba(175,145,80,0.3)]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-title text-2xl uppercase text-white">Rotinas Mais Usadas</h2>
              <p className="mt-1 text-sm text-[#A7A7A7]">Planos atualmente vinculados aos seus alunos</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/rotinas/nova')}
              className="text-sm font-bold text-[#AF9150] transition-colors hover:text-[#D4B060]"
            >
              MONTAR NOVA
            </button>
          </div>

          <div className="mt-6 grid gap-x-12 gap-y-6 md:grid-cols-2">
            {data.mostUsedRoutines?.map((r) => {
              const barWidth = Math.round((r.studentsUsing / maxRoutineStudents) * 100);
              return (
                <div key={r.id} className="flex flex-col">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-white">{r.name}</span>
                    <span className="flex items-baseline gap-1">
                      <span className="font-number text-lg font-bold text-[#AF9150]">{r.studentsUsing}</span>
                      <span className="text-xs text-[#A7A7A7]">alunos</span>
                    </span>
                  </div>
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-[#A7A7A7]">
                    {r.type ?? 'Geral'}
                  </span>
                  <div className="mt-2 h-1 w-full rounded-full bg-[#333333]">
                    <div
                      className="h-1 rounded-full bg-[#AF9150]"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.mostUsedRoutines?.length === 0 && (
              <p className="text-sm text-[#A7A7A7]">Nenhuma rotina em uso.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
