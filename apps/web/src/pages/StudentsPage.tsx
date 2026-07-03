import { useState, useMemo } from 'react';
import { Eye, Search, Mail } from 'lucide-react';
import { students as rawStudents } from '../data/mockData';
import { calculateAge } from '../utils/age';
import type { Routine } from '../types/routine';
import type { Student } from '../data/mockData';
import { Modal } from '../components/Modal';

type FilterStatus = 'TODOS' | 'ATIVOS' | 'INATIVOS';

const filters: FilterStatus[] = ['TODOS', 'ATIVOS', 'INATIVOS'];

export function StudentsPage() {
  const [students] = useState(() => rawStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('TODOS');
  const [assignments, setAssignments] = useState<any[]>(() => {
    try {
      return JSON.parse(window.localStorage.getItem('personaltrainr.assignments') ?? '[]');
    } catch {
      return [];
    }
  });
  const [linkTarget, setLinkTarget] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<Student | null>(null);

  const routines: Routine[] = (() => {
    try {
      return JSON.parse(window.localStorage.getItem('personaltrainr.routines') ?? '[]');
    } catch {
      return [];
    }
  })();

  const [selectedRoutine, setSelectedRoutine] = useState('');
  const [validityDays, setValidityDays] = useState(30);

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

  function getActiveRoutines(studentId: string) {
    return assignments.filter((a: any) => a.studentId === studentId).length;
  }

  function handleLinkRoutine() {
    if (!linkTarget || !selectedRoutine) return;
    const newAssignment = {
      id: crypto.randomUUID(),
      studentId: linkTarget,
      routineId: selectedRoutine,
      days: validityDays,
      createdAt: new Date().toISOString(),
    };
    const updated = [...assignments, newAssignment];
    setAssignments(updated);
    window.localStorage.setItem('personaltrainr.assignments', JSON.stringify(updated));
    setLinkTarget(null);
    setSelectedRoutine('');
    setValidityDays(30);
  }

  return (
    <section className="mx-auto max-w-7xl">
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
                  <p className="text-sm text-text-secondary">{student.objective}</p>
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

            <div className="mt-4 rounded-lg bg-base p-3">
              <div className="grid grid-cols-3 text-center">
                <div>
                  <p className="text-xs uppercase text-text-secondary">PESO</p>
                  <p className="font-number text-accent">{student.weight} kg</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-text-secondary">ALTURA</p>
                  <p className="font-number text-accent">{(student.height * 100).toFixed(0)} cm</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-text-secondary">IDADE</p>
                  <p className="font-number text-accent">{calculateAge(student.birthDate)} a</p>
                </div>
              </div>
            </div>

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
                <p className="text-sm text-text-secondary">{detailTarget.objective}</p>
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
                  <p className="font-number text-accent">{detailTarget.weight} kg</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-text-secondary">Altura</p>
                  <p className="font-number text-accent">{(detailTarget.height * 100).toFixed(0)} cm</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-text-secondary">Idade</p>
                  <p className="font-number text-accent">{calculateAge(detailTarget.birthDate)} anos</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-text-secondary">Data de Nasc.</p>
                  <p className="text-text-primary">{new Date(detailTarget.birthDate).toLocaleDateString('pt-BR')}</p>
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
        onClose={() => { setLinkTarget(null); setSelectedRoutine(''); }}
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

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setLinkTarget(null); setSelectedRoutine(''); }}
              className="rounded-lg border border-border px-5 py-2 text-sm uppercase text-text-secondary transition hover:bg-base"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleLinkRoutine}
              disabled={!selectedRoutine}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-bold uppercase text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Vincular
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
