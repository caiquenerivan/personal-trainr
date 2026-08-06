import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, X } from 'lucide-react';
import { getRoutine, deleteRoutine, type RoutineDetail, type Day } from '../api/routines';
import { Modal } from '../components/Modal';

const WORKOUT_LABELS: Day[] = ['A', 'B', 'C', 'D', 'E'];

export function RoutineViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [routine, setRoutine] = useState<RoutineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getRoutine(id)
      .then(setRoutine)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl">
        <p className="font-body text-text-secondary">Carregando rotina...</p>
      </section>
    );
  }

  if (notFound || !routine) {
    return (
      <section className="mx-auto max-w-7xl">
        <h1 className="font-title text-3xl uppercase text-text-primary">ROTINA NÃO ENCONTRADA</h1>
        <Link to="/rotinas" className="mt-4 inline-flex items-center gap-2 text-sm text-accent transition hover:opacity-80">
          <ArrowLeft size={16} /> Voltar para Rotinas
        </Link>
      </section>
    );
  }

  const workoutDays = WORKOUT_LABELS.slice(0, routine.type.length);

  async function handleDelete() {
    if (!routine) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteRoutine(routine.id);
      navigate('/rotinas', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message || 'Erro ao remover rotina' : 'Erro ao remover rotina';
      setError(msg);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
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

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3">
          <span className="font-body text-sm text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-title text-2xl uppercase tracking-wider text-text-primary">
              {routine.name}
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              Criada em {new Date(routine.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/rotinas/editar/${routine.id}`}
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
          {workoutDays.map((day) => {
            const dayExercises = routine.exercises.filter((e) => e.day === day);
            const description = dayExercises[0]?.dayDescription;
            return (
              <div key={day} className="rounded-xl border border-border bg-base p-5">
                <h3 className="font-title text-lg uppercase tracking-wide text-accent">
                  Treino {day}
                </h3>
                {description && (
                  <p className="mt-1 text-sm text-text-secondary">{description}</p>
                )}

                {dayExercises.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {dayExercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex flex-wrap items-center gap-4 rounded-lg bg-base px-4 py-3"
                      >
                        <span className="flex-1 font-body text-sm text-text-primary">
                          {ex.exercise.name}
                        </span>
                        <span className="font-number text-sm text-accent">
                          {ex.series}x
                        </span>
                        <span className="font-number text-sm text-accent">
                          {ex.reps} reps
                        </span>
                        <span className="text-xs text-text-secondary">
                          {ex.restTime}s descanso
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
            );
          })}
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
            disabled={deleting}
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold uppercase text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
          >
            {deleting ? 'Removendo...' : 'Confirmar Exclusão'}
          </button>
        </div>
      </Modal>
    </section>
  );
}
