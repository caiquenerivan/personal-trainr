import { useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, X } from 'lucide-react';
import { listMyRoutines } from '../api/connections';
import { deleteRoutine, type RoutineType } from '../api/routines';
import { Modal } from '../components/Modal';

type RoutineSummary = {
  id: string;
  name: string;
  type: RoutineType;
  createdAt: string;
};

export function RoutinesPage() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<RoutineSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<RoutineSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    listMyRoutines()
      .then((data) => setRoutines(data.routines ?? []))
      .catch(() => showToast('Erro ao carregar rotinas'))
      .finally(() => setLoading(false));
  }, []);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRoutine(deleteTarget.id);
      setRoutines((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast('Rotina removida com sucesso.');
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message || 'Erro ao remover rotina' : 'Erro ao remover rotina';
      showToast(msg);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl">
        <p className="font-body text-text-secondary">Carregando rotinas...</p>
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
                <p className="mt-0.5 text-sm text-text-secondary">{routine.type}</p>
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
                disabled={deleting}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold uppercase text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
              >
                {deleting ? 'Removendo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}
