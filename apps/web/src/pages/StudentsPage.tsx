import { useEffect, useMemo, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { Eye, Search, Mail, X } from 'lucide-react';
import { getMyStudents, listMyRoutines } from '../api/connections';
import { api } from '../api/client';
import { calculateAge } from '../utils/age';
import { Modal } from '../components/Modal';

type StudentDTO = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  weight: number | null;
  height: number | null;
  birthDate: string | null;
  bio: string | null;
  hasActiveRoutine: boolean;
  routineName: string | null;
};

type RoutineItem = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
};

type FilterStatus = 'TODOS' | 'ATIVOS' | 'INATIVOS';

const filters: FilterStatus[] = ['TODOS', 'ATIVOS', 'INATIVOS'];

export function StudentsPage() {
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('TODOS');
  const [linkTarget, setLinkTarget] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<StudentDTO | null>(null);
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [linking, setLinking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMyStudents(),
      listMyRoutines().catch(() => ({ routines: [] })),
    ])
      .then(([studentsData, routinesData]) => {
        setStudents(studentsData.students ?? []);
        let apiRoutines = routinesData.routines ?? [];
        if (apiRoutines.length === 0) {
          const stored = (() => {
            try {
              return JSON.parse(window.localStorage.getItem('personaltrainr.routines') ?? '[]');
            } catch {
              return [];
            }
          })();
          apiRoutines = stored.map((r: any) => ({
            id: r.id,
            name: r.name,
            type: r.type || r.goal || '',
            createdAt: r.createdAt || '',
          }));
        }
        setRoutines(apiRoutines);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (filterStatus === 'ATIVOS') return s.hasActiveRoutine;
      if (filterStatus === 'INATIVOS') return !s.hasActiveRoutine;
      return true;
    });
  }, [students, searchTerm, filterStatus]);

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.hasActiveRoutine).length;

  async function handleLinkRoutine() {
    if (!linkTarget || !selectedRoutine) return;
    const selected = routines.find((r) => r.id === selectedRoutine);

    let workouts: Array<{ day: string; exercises: Array<{ name: string; series: number; reps: number; rest: number }> }> | undefined;
    try {
      const stored = JSON.parse(window.localStorage.getItem('personaltrainr.routines') ?? '[]');
      const full = stored.find((r: any) => r.id === selectedRoutine);
      if (full?.workouts) {
        workouts = full.workouts.map((w: any) => ({
          day: w.day,
          description: w.description,
          exercises: (w.exercises ?? []).map((e: any) => ({
            name: e.name,
            series: e.series,
            reps: e.reps,
            rest: e.rest,
          })),
        }));
      }
    } catch {}

    setLinking(true);
    try {
      await api.post('/api/routines/assign', {
        alunoId: linkTarget,
        routineId: selectedRoutine,
        days: validityDays,
        weeklyGoal,
        routineName: selected?.name,
        workouts,
      });
      const data = await getMyStudents();
      setStudents(data.students ?? []);
      setLinkTarget(null);
      setSelectedRoutine('');
      setValidityDays(30);
      setWeeklyGoal(3);
      showToast('Rotina vinculada com sucesso!');
    } catch (err: unknown) {
      const msg =
        err instanceof AxiosError
          ? err.response?.data?.message || 'Erro ao vincular rotina'
          : 'Erro ao vincular rotina';
      showToast(msg);
    } finally {
      setLinking(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl">
        <p className="font-body text-text-secondary">Carregando alunos...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl">
      {toast && (
        <div className="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-xl border border-accent/40 bg-card px-5 py-3 shadow-lg shadow-black/40 animate-slide-up">
          <span className="font-body text-sm text-text-primary">{toast}</span>
          <button onClick={() => setToast(null)} className="text-text-secondary hover:text-text-primary">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="mb-2 flex items-baseline gap-3">
        <h1 className="font-title text-3xl uppercase text-text-primary">ALUNOS</h1>
        <span className="text-sm text-text-secondary">
          {totalStudents} {totalStudents === 1 ? 'aluno' : 'alunos'} &bull; {activeStudents} com rotina ativa
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar alunos..."
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-accent"
          />
        </div>

        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase transition ${
                filterStatus === f
                  ? 'bg-accent text-black'
                  : 'bg-base text-text-secondary hover:bg-card'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {students.length === 0 && !loading && (
        <p className="mt-10 text-center font-body text-sm text-text-secondary">
          Nenhum aluno conectado a você ainda.
        </p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.map((student, i) => (
          <div
            key={student.id}
            onClick={() => setDetailTarget(student)}
            className="cursor-pointer rounded-xl bg-card p-5 transition-shadow duration-300 ring-1 ring-transparent hover:ring-accent animate-slide-up"
            style={{ animationDelay: `${Math.min(i * 50, 500)}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-base text-sm font-bold uppercase text-text-secondary">
                  {student.avatarUrl ? (
                    <img src={student.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    student.name.charAt(0)
                  )}
                </div>
                <div>
                  <h2 className="font-title text-lg uppercase tracking-wide text-text-primary">
                    {student.name}
                  </h2>
                  {student.bio && (
                    <p className="text-sm text-text-secondary line-clamp-1">{student.bio}</p>
                  )}
                </div>
              </div>

              {student.hasActiveRoutine ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-900/30 px-3 py-1 text-xs text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  ATIVO
                </span>
              ) : (
                <span className="inline-block rounded-full bg-base px-3 py-1 text-xs text-text-secondary">
                  INATIVO
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-sm text-text-secondary">
              <Mail size={14} />
              {student.email}
            </div>

            {(student.weight || student.height || student.birthDate) && (
              <div className="mt-4 rounded-lg bg-base p-3">
                <div className="grid grid-cols-3 text-center">
                  <div>
                    <p className="text-xs uppercase text-text-secondary">PESO</p>
                    <p className="font-number text-accent">
                      {student.weight ? `${student.weight} kg` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-text-secondary">ALTURA</p>
                    <p className="font-number text-accent">
                      {student.height ? `${(student.height * 100).toFixed(0)} cm` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-text-secondary">IDADE</p>
                    <p className="font-number text-accent">
                      {student.birthDate ? `${calculateAge(student.birthDate)} a` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-1.5 text-xs text-accent uppercase">
              ROTINA
              <span className="text-text-secondary">&bull;</span>
              <span className="text-text-secondary normal-case">
                {student.routineName ?? 'Nenhuma vinculada'}
              </span>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDetailTarget(student); }}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs uppercase text-text-secondary transition hover:bg-base"
              >
                <Eye size={14} />
                Ver Detalhes
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLinkTarget(student.id); }}
                className="rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase text-black transition hover:opacity-90"
              >
                Vincular Rotina
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={detailTarget?.name ?? 'Detalhes do Aluno'}
      >
        {detailTarget && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-base text-xl font-bold uppercase text-text-secondary">
                {detailTarget.avatarUrl ? (
                  <img src={detailTarget.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  detailTarget.name.charAt(0)
                )}
              </div>
              <div>
                <h3 className="font-title text-xl uppercase text-text-primary">{detailTarget.name}</h3>
                {detailTarget.bio && (
                  <p className="text-sm text-text-secondary">{detailTarget.bio}</p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-base/50 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase text-text-secondary">Email</p>
                  <p className="text-text-primary">{detailTarget.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-text-secondary">Status</p>
                  <p className={detailTarget.hasActiveRoutine ? 'text-green-400' : 'text-text-secondary'}>
                    {detailTarget.hasActiveRoutine ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-text-secondary">Peso</p>
                  <p className="font-number text-accent">
                    {detailTarget.weight ? `${detailTarget.weight} kg` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-text-secondary">Altura</p>
                  <p className="font-number text-accent">
                    {detailTarget.height ? `${(detailTarget.height * 100).toFixed(0)} cm` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-text-secondary">Idade</p>
                  <p className="font-number text-accent">
                    {detailTarget.birthDate ? `${calculateAge(detailTarget.birthDate)} anos` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-text-secondary">Data de Nasc.</p>
                  <p className="text-text-primary">
                    {detailTarget.birthDate
                      ? new Date(detailTarget.birthDate).toLocaleDateString('pt-BR')
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDetailTarget(null)}
                className="rounded-lg border border-border px-5 py-2 text-sm uppercase text-text-secondary transition hover:bg-base"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!linkTarget}
        onClose={() => { setLinkTarget(null); setSelectedRoutine(''); setWeeklyGoal(3); }}
        title="Vincular Rotina"
      >
        <div className="space-y-5">
          <label className="block space-y-2">
            <span className="text-xs uppercase text-text-secondary">Rotina</span>
            <select
              value={selectedRoutine}
              onChange={(e) => setSelectedRoutine(e.target.value)}
              className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
            >
              <option value="">Selecione uma rotina</option>
              {routines.length === 0 && (
                <option value="" disabled>Nenhuma rotina encontrada. Crie uma primeiro.</option>
              )}
              {routines.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase text-text-secondary">Validade do Treino (em dias)</span>
            <input
              type="number"
              min={1}
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase text-text-secondary">Meta de Treinos por Semana</span>
            <input
              type="number"
              min={1}
              max={7}
              value={weeklyGoal}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= 7) setWeeklyGoal(val);
              }}
              className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setLinkTarget(null); setSelectedRoutine(''); setWeeklyGoal(3); }}
              className="rounded-lg border border-border px-5 py-2 text-sm uppercase text-text-secondary transition hover:bg-base"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleLinkRoutine}
              disabled={!selectedRoutine || linking}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-bold uppercase text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {linking ? 'Vinculando...' : 'Vincular'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}