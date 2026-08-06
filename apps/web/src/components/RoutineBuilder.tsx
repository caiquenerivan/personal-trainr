import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { ChevronDown, Plus, Trash2, X } from 'lucide-react';
import { listExercises, type ApiExercise } from '../api/exercises';
import { getRoutine, createRoutine, updateRoutine, type Day, type RoutineType } from '../api/routines';

const WORKOUT_LABELS: Day[] = ['A', 'B', 'C', 'D', 'E'];
const TYPE_BY_COUNT: Record<number, RoutineType> = { 2: 'AB', 3: 'ABC', 4: 'ABCD', 5: 'ABCDE' };

type BuilderExercise = {
  exerciseId: string;
  series: number;
  reps: number;
  restTime: number;
};

type BuilderWorkout = {
  day: Day;
  description: string;
  exercises: BuilderExercise[];
};

function buildEmptyWorkouts(count: number): BuilderWorkout[] {
  return WORKOUT_LABELS.slice(0, count).map((day) => ({
    day,
    description: '',
    exercises: [],
  }));
}

type Props = {
  routineId?: string;
};

export function RoutineBuilder({ routineId }: Props) {
  const navigate = useNavigate();
  const isEditing = !!routineId;

  const [name, setName] = useState('');
  const [workoutCount, setWorkoutCount] = useState(2);
  const [workouts, setWorkouts] = useState<BuilderWorkout[]>(() => buildEmptyWorkouts(2));
  const [activeTab, setActiveTab] = useState<Day>('A');
  const [exerciseOptions, setExerciseOptions] = useState<ApiExercise[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listExercises().catch(() => []).then((options) => setExerciseOptions(options ?? []));
  }, []);

  useEffect(() => {
    if (!routineId) return;
    setLoading(true);
    getRoutine(routineId)
      .then((routine) => {
        setName(routine.name);
        const count = routine.type.length;
        setWorkoutCount(count);
        const labels = WORKOUT_LABELS.slice(0, count);
        setWorkouts(
          labels.map((day) => {
            const dayExercises = routine.exercises.filter((e) => e.day === day);
            return {
              day,
              description: dayExercises[0]?.dayDescription ?? '',
              exercises: dayExercises.map((e) => ({
                exerciseId: e.exercise.id,
                series: e.series,
                reps: e.reps,
                restTime: e.restTime,
              })),
            };
          }),
        );
        setActiveTab(labels[0]);
      })
      .catch(() => setError('Erro ao carregar rotina'))
      .finally(() => setLoading(false));
  }, [routineId]);

  function handleWorkoutCountChange(value: number) {
    setWorkoutCount(value);
    const labels = WORKOUT_LABELS.slice(0, value);
    setWorkouts((prev) => {
      const next = labels.map((day, i) => {
        const existing = prev[i];
        return existing && existing.day === day
          ? existing
          : { day, description: '', exercises: [] };
      });
      return next;
    });
    setActiveTab(labels[0]);
  }

  function updateWorkout(index: number, patch: Partial<BuilderWorkout>) {
    setWorkouts((prev) =>
      prev.map((w, i) => (i === index ? { ...w, ...patch } : w)),
    );
  }

  function addExercise(workoutIndex: number) {
    setWorkouts((prev) =>
      prev.map((w, i) =>
        i === workoutIndex
          ? { ...w, exercises: [...w.exercises, { exerciseId: '', series: 3, reps: 10, restTime: 60 }] }
          : w,
      ),
    );
  }

  function removeExercise(workoutIndex: number, exerciseIndex: number) {
    setWorkouts((prev) =>
      prev.map((w, i) =>
        i === workoutIndex
          ? { ...w, exercises: w.exercises.filter((_, ei) => ei !== exerciseIndex) }
          : w,
      ),
    );
  }

  function updateExercise(
    workoutIndex: number,
    exerciseIndex: number,
    patch: Partial<BuilderExercise>,
  ) {
    setWorkouts((prev) =>
      prev.map((w, i) =>
        i === workoutIndex
          ? {
              ...w,
              exercises: w.exercises.map((e, ei) =>
                ei === exerciseIndex ? { ...e, ...patch } : e,
              ),
            }
          : w,
      ),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const exercises = workouts.flatMap((w) =>
      w.exercises
        .filter((e) => e.exerciseId)
        .map((e) => ({
          exerciseId: e.exerciseId,
          day: w.day,
          dayDescription: w.description || undefined,
          series: e.series,
          reps: e.reps,
          restTime: e.restTime,
        })),
    );

    if (exercises.length === 0) {
      setError('Adicione ao menos um exercício.');
      return;
    }

    setSaving(true);
    try {
      const payload = { name, type: TYPE_BY_COUNT[workoutCount], exercises };
      const routine = isEditing
        ? await updateRoutine(routineId!, payload)
        : await createRoutine(payload);
      navigate(`/rotinas/ver/${routine.id}`);
    } catch (err: unknown) {
      const msg =
        err instanceof AxiosError
          ? err.response?.data?.message || 'Erro ao salvar rotina'
          : 'Erro ao salvar rotina';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const activeIndex = workouts.findIndex((w) => w.day === activeTab);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl">
        <p className="font-body text-text-secondary">Carregando rotina...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6 border-b border-border pb-6">
        <h1 className="font-title text-3xl uppercase text-text-primary">
          {isEditing ? 'EDITAR ROTINA' : 'MONTAR NOVA ROTINA'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3">
          <span className="font-body text-sm text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="grid gap-4 rounded-xl border border-border bg-card p-6 md:grid-cols-4">
          <label className="space-y-2 md:col-span-3">
            <span className="text-xs uppercase text-text-secondary">
              Nome da Rotina
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
              required
              minLength={2}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase text-text-secondary">
              Quantidade de Treinos
            </span>
            <div className="relative">
              <select
                value={workoutCount}
                onChange={(e) => handleWorkoutCountChange(Number(e.target.value))}
                className="w-full appearance-none rounded-lg border border-border bg-base p-3 pr-10 text-text-primary outline-none focus:border-accent"
              >
                {[2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} treinos
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-accent"
              />
            </div>
          </label>

        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-5 border-b border-border">
            {workouts.map((w) => {
              const isActive = activeTab === w.day;
              return (
                <button
                  key={w.day}
                  type="button"
                  onClick={() => setActiveTab(w.day)}
                  className={`border-b-2 px-1 pb-3 font-body text-sm uppercase transition ${
                    isActive
                      ? 'border-accent text-accent'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Treino {w.day}
                </button>
              );
            })}
          </div>

          {/* Active workout panel */}
          {activeIndex >= 0 && activeIndex < workouts.length && (
            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-xs uppercase text-text-secondary">
                  Descrição do Treino {activeTab}
                </span>
                <input
                value={workouts[activeIndex].description}
                onChange={(e) =>
                  updateWorkout(activeIndex, { description: e.target.value })
                }
                placeholder="Ex: Peito e Bíceps"
                className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
              />
            </label>

            {/* Exercise cards */}
            <div className="space-y-3">
              {workouts[activeIndex].exercises.map((exercise, ei) => (
                <div
                  key={ei}
                  className="flex flex-wrap items-end gap-3 rounded-xl bg-base p-4"
                >
                  <label className="flex-1 space-y-1 min-w-[160px]">
                    <span className="text-xs uppercase text-text-secondary">
                      Exercício
                    </span>
                    <div className="relative">
                      <select
                        value={exercise.exerciseId}
                        onChange={(e) =>
                          updateExercise(activeIndex, ei, {
                            exerciseId: e.target.value,
                          })
                        }
                        className="w-full appearance-none rounded-lg border border-border bg-base p-3 pr-10 text-text-primary outline-none focus:border-accent"
                        required
                      >
                        <option value="">Selecione</option>
                        {exerciseOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}{opt.muscle ? ` (${opt.muscle})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-accent"
                      />
                    </div>
                  </label>

                  <label className="w-20 space-y-1">
                    <span className="text-xs uppercase text-text-secondary">
                      Séries
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={exercise.series}
                      onChange={(e) =>
                        updateExercise(activeIndex, ei, {
                          series: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
                      required
                    />
                  </label>

                  <label className="w-24 space-y-1">
                    <span className="text-xs uppercase text-text-secondary">
                      Repetições
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={exercise.reps}
                      onChange={(e) =>
                        updateExercise(activeIndex, ei, {
                          reps: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
                      required
                    />
                  </label>

                  <label className="w-28 space-y-1">
                    <span className="text-xs uppercase text-text-secondary">
                      Descanso (s)
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={exercise.restTime}
                      onChange={(e) =>
                        updateExercise(activeIndex, ei, {
                          restTime: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
                      required
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => removeExercise(activeIndex, ei)}
                    className="mb-0.5 flex items-center justify-center rounded-lg p-2.5 text-accent transition hover:bg-base min-h-[44px] min-w-[44px]"
                    title="Remover exercício"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addExercise(activeIndex)}
              className="flex items-center gap-2 rounded-lg border border-accent px-4 py-3 font-body text-sm text-accent transition hover:bg-accent hover:text-black"
            >
              <Plus size={16} />
              Adicionar Exercício
            </button>
          </div>
        )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="block min-h-14 w-full rounded-lg bg-accent px-6 py-4 font-bold uppercase text-black transition disabled:cursor-wait disabled:opacity-70"
        >
          {saving ? 'Salvando...' : isEditing ? 'ATUALIZAR ROTINA' : 'SALVAR ROTINA'}
        </button>
      </form>
    </section>
  );
}
