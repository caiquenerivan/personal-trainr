import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import { Plus, Search, X } from 'lucide-react';
import { listExercises, createExercise, updateExercise, deleteExercise, type ApiExercise } from '../api/exercises';
import { Modal } from '../components/Modal';

function getCurrentUserId(): string | null {
  try {
    const raw = window.localStorage.getItem('personaltrainr.user');
    return raw ? JSON.parse(raw)?.id ?? null : null;
  } catch {
    return null;
  }
}

type ExerciseForm = {
  name: string;
  muscle: string;
  videoUrl: string;
  gifUrl: string;
  observations: string;
};

const EMPTY_FORM: ExerciseForm = { name: '', muscle: '', videoUrl: '', gifUrl: '', observations: '' };

const MUSCLE_GROUPS = [
  'Pernas', 'Peito', 'Costas', 'Ombros', 'Posterior',
  'Bíceps', 'Tríceps', 'Abdômen', 'Glúteos', 'Antebraço',
];

function toPayload(form: ExerciseForm) {
  return {
    name: form.name,
    muscle: form.muscle || null,
    videoUrl: form.videoUrl || null,
    gifUrl: form.gifUrl || null,
    observations: form.observations || null,
  };
}

export function ExercisesPage() {
  const userId = getCurrentUserId();
  const [exercises, setExercises] = useState<ApiExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiExercise | null>(null);
  const [detailTarget, setDetailTarget] = useState<ApiExercise | null>(null);
  const [form, setForm] = useState<ExerciseForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    listExercises()
      .then(setExercises)
      .catch(() => showToast('Erro ao carregar exercícios'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.muscle ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setShowCreate(true);
  }

  function openEdit(exercise: ApiExercise) {
    setForm({
      name: exercise.name,
      muscle: exercise.muscle ?? '',
      videoUrl: exercise.videoUrl ?? '',
      gifUrl: exercise.gifUrl ?? '',
      observations: exercise.observations ?? '',
    });
    setEditTarget(exercise);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!form.name || !form.muscle) return;
    setSaving(true);
    try {
      const exercise = await createExercise(toPayload(form));
      setExercises((prev) => [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name)));
      setShowCreate(false);
      setForm(EMPTY_FORM);
      showToast('Exercício cadastrado com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message || 'Erro ao cadastrar exercício' : 'Erro ao cadastrar exercício';
      showToast(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    if (!editTarget || !form.name || !form.muscle) return;
    setSaving(true);
    try {
      const updated = await updateExercise(editTarget.id, toPayload(form));
      setExercises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setEditTarget(null);
      showToast('Exercício atualizado com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message || 'Erro ao atualizar exercício' : 'Erro ao atualizar exercício';
      showToast(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(exercise: ApiExercise) {
    if (!window.confirm(`Remover o exercício "${exercise.name}"?`)) return;
    try {
      await deleteExercise(exercise.id);
      setExercises((prev) => prev.filter((e) => e.id !== exercise.id));
      showToast('Exercício removido.');
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message || 'Erro ao remover exercício' : 'Erro ao remover exercício';
      showToast(msg);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl">
        <p className="font-body text-text-secondary">Carregando exercícios...</p>
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
        <h1 className="font-title text-3xl uppercase text-text-primary">EXERCÍCIOS</h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-bold uppercase text-black transition hover:opacity-90"
        >
          <Plus size={18} />
          Cadastrar Exercício
        </button>
      </div>

      <div className="relative mt-6">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou grupo muscular..."
          className="w-full rounded-lg border border-border bg-base py-3 pl-11 pr-4 text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="col-span-full rounded-xl border border-border bg-card px-4 py-5 text-center font-body text-text-secondary">
            Nenhum exercício encontrado.
          </p>
        ) : (
          filtered.map((exercise) => {
            const isOwner = !!userId && exercise.trainerId === userId;
            return (
              <div
                key={exercise.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h2 className="font-title text-base uppercase tracking-wide text-text-primary">
                  {exercise.name}
                </h2>
                <p className="mt-1 text-sm text-text-secondary">{exercise.muscle}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailTarget(exercise)}
                    className="rounded-lg border border-accent px-4 py-2 text-xs uppercase text-accent transition hover:bg-accent hover:text-black"
                  >
                    Ver Detalhes
                  </button>
                  {isOwner && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(exercise)}
                        className="rounded-lg border border-border px-4 py-2 text-xs uppercase text-text-secondary transition hover:bg-base"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(exercise)}
                        className="rounded-lg border border-border px-4 py-2 text-xs uppercase text-text-secondary transition hover:bg-base"
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        open={showCreate || !!editTarget}
        onClose={() => { setShowCreate(false); setEditTarget(null); setForm(EMPTY_FORM); }}
        title={editTarget ? 'Editar Exercício' : 'Cadastrar Exercício'}
      >
        <form onSubmit={editTarget ? handleUpdate : handleCreate} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs uppercase text-text-secondary">Nome</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase text-text-secondary">Grupo Muscular</span>
            <select
              value={form.muscle}
              onChange={(e) => setForm({ ...form, muscle: e.target.value })}
              className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
              required
            >
              <option value="">Selecione</option>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase text-text-secondary">URL do Vídeo</span>
            <input
              type="url"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase text-text-secondary">URL do GIF</span>
            <input
              type="url"
              value={form.gifUrl}
              onChange={(e) => setForm({ ...form, gifUrl: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase text-text-secondary">Observações</span>
            <textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowCreate(false); setEditTarget(null); setForm(EMPTY_FORM); }}
              className="rounded-lg border border-border px-5 py-2 text-sm uppercase text-text-secondary transition hover:bg-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-bold uppercase text-black transition hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title="Detalhes do Exercício"
      >
        {detailTarget && (
          <div className="space-y-4">
            <div>
              <h3 className="font-title text-lg uppercase text-text-primary">
                {detailTarget.name}
              </h3>
              <p className="text-sm text-text-secondary">{detailTarget.muscle}</p>
            </div>

            {detailTarget.gifUrl && (
              <div className="overflow-hidden rounded-lg bg-base">
                <img
                  src={detailTarget.gifUrl}
                  alt={detailTarget.name}
                  className="w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {detailTarget.observations && (
              <div>
                <span className="text-xs uppercase text-text-secondary">Observações</span>
                <p className="mt-1 rounded-lg border border-border bg-base px-4 py-3 text-sm text-text-primary">
                  {detailTarget.observations}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  );
}
