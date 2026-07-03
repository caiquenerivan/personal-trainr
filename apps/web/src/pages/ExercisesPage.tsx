import { useState, type FormEvent } from 'react';
import { Plus, Search } from 'lucide-react';
import { exercises as initialExercises, type Exercise } from '../data/mockData';
import { Modal } from '../components/Modal';

type NewExercise = {
  name: string;
  muscleGroup: string;
  videoUrl: string;
  gifUrl: string;
  observations: string;
};

const MUSCLE_GROUPS = [
  'Pernas', 'Peito', 'Costas', 'Ombros', 'Posterior',
  'Bíceps', 'Tríceps', 'Abdômen', 'Glúteos', 'Antebraço',
];

export function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    try {
      const stored = window.localStorage.getItem('personaltrainr.exercises');
      return stored ? JSON.parse(stored) : initialExercises;
    } catch {
      return initialExercises;
    }
  });
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Exercise | null>(null);

  const [newEx, setNewEx] = useState<NewExercise>({
    name: '', muscleGroup: '', videoUrl: '', gifUrl: '', observations: '',
  });
  const [saving, setSaving] = useState(false);

  const filtered = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.muscleGroup.toLowerCase().includes(search.toLowerCase()),
  );

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newEx.name || !newEx.muscleGroup) return;
    setSaving(true);

    const exercise: Exercise = {
      id: `exercise-${crypto.randomUUID()}`,
      ...newEx,
    };

    const updated = [...exercises, exercise];
    setExercises(updated);
    window.localStorage.setItem('personaltrainr.exercises', JSON.stringify(updated));

    setNewEx({ name: '', muscleGroup: '', videoUrl: '', gifUrl: '', observations: '' });
    setSaving(false);
    setShowCreate(false);
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-title text-3xl uppercase text-text-primary">EXERCÍCIOS</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
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
          filtered.map((exercise) => (
            <div
              key={exercise.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <h2 className="font-title text-base uppercase tracking-wide text-text-primary">
                {exercise.name}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">{exercise.muscleGroup}</p>
              <button
                type="button"
                onClick={() => setDetailTarget(exercise)}
                className="mt-4 rounded-lg border border-accent px-4 py-2 text-xs uppercase text-accent transition hover:bg-accent hover:text-black"
              >
                Ver Detalhes
              </button>
            </div>
          ))
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); setNewEx({ name: '', muscleGroup: '', videoUrl: '', gifUrl: '', observations: '' }); }}
        title="Cadastrar Exercício"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs uppercase text-text-secondary">Nome</span>
            <input
              type="text"
              value={newEx.name}
              onChange={(e) => setNewEx({ ...newEx, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase text-text-secondary">Grupo Muscular</span>
            <select
              value={newEx.muscleGroup}
              onChange={(e) => setNewEx({ ...newEx, muscleGroup: e.target.value })}
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
              value={newEx.videoUrl}
              onChange={(e) => setNewEx({ ...newEx, videoUrl: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase text-text-secondary">URL do GIF</span>
            <input
              type="url"
              value={newEx.gifUrl}
              onChange={(e) => setNewEx({ ...newEx, gifUrl: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase text-text-secondary">Observações</span>
            <textarea
              value={newEx.observations}
              onChange={(e) => setNewEx({ ...newEx, observations: e.target.value })}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowCreate(false); setNewEx({ name: '', muscleGroup: '', videoUrl: '', gifUrl: '', observations: '' }); }}
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
              <p className="text-sm text-text-secondary">{detailTarget.muscleGroup}</p>
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
