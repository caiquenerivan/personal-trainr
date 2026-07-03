import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { Routine } from '../types/routine';
import { Modal } from '../components/Modal';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function RoutinesPage() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<Routine[]>(
    () => loadJSON<Routine[]>('personaltrainr.routines', []),
  );
  const [deleteTarget, setDeleteTarget] = useState<Routine | null>(null);

  const assignments = loadJSON<any[]>('personaltrainr.assignments', []);

  function getStudentCount(routineId: string) {
    return assignments.filter((a: any) => a.routineId === routineId).length;
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    const updated = routines.filter((r) => r.id !== deleteTarget.id);
    setRoutines(updated);
    window.localStorage.setItem('personaltrainr.routines', JSON.stringify(updated));
    setDeleteTarget(null);
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-title text-3xl uppercase text-text-primary">ROTINAS</h1>
        <Link
          to="/rotinas/nova"
          className="rounded-lg bg-accent px-5 py-3 font-bold uppercase text-black transition hover:opacity-90"
        >
          Nova rotina
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {routines.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-5 font-body text-text-secondary">
            Nenhuma rotina criada ainda.
          </p>
        ) : (
          routines.map((routine, i) => (
            <article
              key={routine.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 animate-slide-up"
              style={{ animationDelay: `${Math.min(i * 50, 500)}ms` }}
            >
              <div>
                <h2 className="font-body text-base text-text-primary">{routine.name}</h2>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {routine.savedAsModel
                    ? 'Modelo sem aluno vinculado'
                    : 'Rotina vinculada a aluno'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  title="Visualizar"
                  onClick={() => navigate(`/rotinas/ver/${routine.id}`)}
                  className="flex items-center justify-center rounded-lg p-2.5 text-accent transition hover:bg-base min-h-[44px] min-w-[44px]"
                >
                  <Eye size={18} />
                </button>
                <button
                  type="button"
                  title="Editar"
                  onClick={() => navigate(`/rotinas/editar/${routine.id}`)}
                  className="flex items-center justify-center rounded-lg p-2.5 text-accent transition hover:bg-base min-h-[44px] min-w-[44px]"
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  title="Excluir"
                  onClick={() => setDeleteTarget(routine)}
                  className="flex items-center justify-center rounded-lg p-2.5 text-accent transition hover:bg-base min-h-[44px] min-w-[44px]"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir Rotina"
      >
        {deleteTarget && (
          <>
            <p className="font-body text-sm text-text-primary">
              Tem certeza que deseja excluir{' '}
              <strong className="text-accent">{deleteTarget.name}</strong>?
            </p>
            {getStudentCount(deleteTarget.id) > 0 && (
              <p className="mt-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
                Atenção: {getStudentCount(deleteTarget.id)} aluno(s) está(ão) vinculado(s) a esta
                rotina.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-border px-5 py-2 text-sm uppercase text-text-secondary transition hover:bg-base"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold uppercase text-white transition hover:opacity-90"
              >
                Confirmar Exclusão
              </button>
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}
