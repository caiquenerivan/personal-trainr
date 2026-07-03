import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import type { Routine } from '../types/routine';
import { Modal } from '../components/Modal';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function RoutineViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const saved: Routine[] = loadJSON<Routine[]>('personaltrainr.routines', []);
  const routine = saved.find((r) => r.id === id);

  if (!routine) {
    return (
      <section className="mx-auto max-w-7xl">
        <h1 className="font-title text-3xl uppercase text-text-primary">ROTINA NÃO ENCONTRADA</h1>
        <Link to="/rotinas" className="mt-4 inline-flex items-center gap-2 text-sm text-accent transition hover:opacity-80">
          <ArrowLeft size={16} /> Voltar para Rotinas
        </Link>
      </section>
    );
  }

  const assignments = loadJSON<any[]>('personaltrainr.assignments', []);
  const studentCount = assignments.filter((a: any) => a.routineId === routine.id).length;
  const routineId = routine.id;

  function handleDelete() {
    const updated = saved.filter((r) => r.id !== routineId);
    window.localStorage.setItem('personaltrainr.routines', JSON.stringify(updated));
    setShowDeleteModal(false);
    navigate('/rotinas', { replace: true });
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center gap-4 border-b border-border pb-6">
        <Link
          to="/rotinas"
          className="flex items-center justify-center rounded-lg p-2 text-accent transition hover:bg-base min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-title text-3xl uppercase text-text-primary">DETALHES DA ROTINA</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-title text-2xl uppercase tracking-wider text-text-primary">
              {routine.name}
            </h2>
            {routine.goal && (
              <p className="mt-1 text-sm text-text-secondary">Objetivo: {routine.goal}</p>
            )}
            <p className="mt-1 text-xs text-text-secondary">
              Criada em {new Date(routine.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/rotinas/editar/${routineId}`}
              className="inline-flex items-center gap-2 rounded-lg border border-accent px-4 py-2 text-sm uppercase text-accent transition hover:bg-accent hover:text-black"
            >
              <Pencil size={16} />
              Editar
            </Link>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 px-4 py-2 text-sm uppercase text-red-400 transition hover:bg-red-500/10"
            >
              <Trash2 size={16} />
              Excluir
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {routine.workouts.map((workout) => (
            <div key={workout.day} className="rounded-xl border border-border bg-base p-5">
              <h3 className="font-title text-lg uppercase tracking-wide text-accent">
                Treino {workout.day}
              </h3>
              {workout.description && (
                <p className="mt-1 text-sm text-text-secondary">{workout.description}</p>
              )}

              {workout.exercises.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {workout.exercises.map((exercise, ei) => (
                    <div
                      key={ei}
                      className="flex flex-wrap items-center gap-4 rounded-lg bg-base px-4 py-3"
                    >
                      <span className="flex-1 font-body text-sm text-text-primary">
                        {exercise.name}
                      </span>
                      <span className="font-number text-sm text-accent">
                        {exercise.series}x
                      </span>
                      <span className="font-number text-sm text-accent">
                        {exercise.reps} reps
                      </span>
                      <span className="text-xs text-text-secondary">
                        {exercise.rest}s descanso
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-text-secondary">
                  Nenhum exercício cadastrado neste treino.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Excluir Rotina"
      >
        <p className="font-body text-sm text-text-primary">
          Tem certeza que deseja excluir <strong className="text-accent">{routine.name}</strong>?
        </p>
        {studentCount > 0 && (
          <p className="mt-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
            Atenção: {studentCount} aluno(s) está(ão) vinculado(s) a esta rotina.
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowDeleteModal(false)}
            className="rounded-lg border border-border px-5 py-2 text-sm uppercase text-text-secondary transition hover:bg-base"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold uppercase text-white transition hover:opacity-90"
          >
            Confirmar Exclusão
          </button>
        </div>
      </Modal>
    </section>
  );
}
