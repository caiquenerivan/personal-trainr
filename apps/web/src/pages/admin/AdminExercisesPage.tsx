import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import {
  listGlobalExercises,
  createGlobalExercise,
  updateGlobalExercise,
  deleteGlobalExercise,
  type AdminExercise,
} from '../../api/admin';
import { Modal } from '../../components/Modal';

type ExerciseForm = { name: string; muscle: string; videoUrl: string; gifUrl: string; observations: string };
const EMPTY_FORM: ExerciseForm = { name: '', muscle: '', videoUrl: '', gifUrl: '', observations: '' };

function toPayload(form: ExerciseForm) {
  return {
    name: form.name,
    muscle: form.muscle || null,
    videoUrl: form.videoUrl || null,
    gifUrl: form.gifUrl || null,
    observations: form.observations || null,
  };
}

export function AdminExercisesPage() {
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminExercise | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminExercise | null>(null);
  const [form, setForm] = useState<ExerciseForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  function loadExercises() {
    setLoading(true);
    listGlobalExercises()
      .then(setExercises)
      .catch(() => showToast('Erro ao carregar exercícios'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadExercises();
  }, []);

  const filtered = exercises.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) || (e.muscle ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowCreate(true);
  }

  function openEdit(exercise: AdminExercise) {
    setForm({
      name: exercise.name,
      muscle: exercise.muscle ?? '',
      videoUrl: exercise.videoUrl ?? '',
      gifUrl: exercise.gifUrl ?? '',
      observations: exercise.observations ?? '',
    });
    setFormError(null);
    setEditTarget(exercise);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editTarget) {
        await updateGlobalExercise(editTarget.id, toPayload(form));
        showToast('Exercício atualizado!');
      } else {
        await createGlobalExercise(toPayload(form));
        showToast('Exercício global criado!');
      }
      setShowCreate(false);
      setEditTarget(null);
      loadExercises();
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message || 'Erro ao salvar exercício' : 'Erro ao salvar exercício';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteGlobalExercise(deleteTarget.id);
      showToast('Exercício removido.');
      setDeleteTarget(null);
      loadExercises();
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message || 'Erro ao remover exercício' : 'Erro ao remover exercício';
      showToast(msg);
    }
  }

  const isModalOpen = showCreate || !!editTarget;

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-accent">PAINEL ADMIN</span>
          <h1 className="mt-2 font-title text-4xl uppercase text-white sm:text-5xl">Exercícios Globais</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-text-secondary">
            Exercícios visíveis para todos os trainers da plataforma.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black transition hover:bg-accent-light"
        >
          <Plus size={16} />
          Novo exercício
        </button>
      </div>

      <div className="relative mt-8 max-w-xs">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar exercício ou grupo muscular"
          className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-text-secondary">
              <th className="px-5 py-4">Nome</th>
              <th className="px-5 py-4">Grupo muscular</th>
              <th className="px-5 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-text-secondary">Carregando...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-text-secondary">Nenhum exercício global encontrado.</td>
              </tr>
            ) : (
              filtered.map((ex) => (
                <tr key={ex.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-4 text-text-primary">{ex.name}</td>
                  <td className="px-5 py-4 text-text-secondary">{ex.muscle ?? '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(ex)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition hover:bg-base hover:text-accent"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(ex)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition hover:bg-base hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => {
          setShowCreate(false);
          setEditTarget(null);
        }}
        title={editTarget ? 'Editar exercício' : 'Novo exercício global'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">{formError}</p>}
          <div>
            <label className="mb-1 block text-xs uppercase text-text-secondary">Nome</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-border bg-base px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-text-secondary">Grupo muscular</label>
            <input
              value={form.muscle}
              onChange={(e) => setForm((f) => ({ ...f, muscle: e.target.value }))}
              className="w-full rounded-lg border border-border bg-base px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-text-secondary">URL do vídeo</label>
            <input
              value={form.videoUrl}
              onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
              className="w-full rounded-lg border border-border bg-base px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-text-secondary">URL do gif</label>
            <input
              value={form.gifUrl}
              onChange={(e) => setForm((f) => ({ ...f, gifUrl: e.target.value }))}
              className="w-full rounded-lg border border-border bg-base px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-text-secondary">Observações</label>
            <textarea
              value={form.observations}
              onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-border bg-base px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setEditTarget(null);
              }}
              className="rounded-lg px-4 py-2.5 text-sm text-text-secondary transition hover:text-text-primary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-accent-light disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remover exercício">
        <p className="text-sm text-text-secondary">
          Tem certeza que deseja remover <strong className="text-text-primary">{deleteTarget?.name}</strong>? Trainers que já usam esse exercício em rotinas podem ser afetados.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setDeleteTarget(null)} className="rounded-lg px-4 py-2.5 text-sm text-text-secondary transition hover:text-text-primary">
            Cancelar
          </button>
          <button onClick={handleDelete} className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500">
            Remover
          </button>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-card px-5 py-3 text-sm text-text-primary shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </section>
  );
}
