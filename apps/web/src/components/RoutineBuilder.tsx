import { useEffect, useState, type FormEvent } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import type { Routine, Workout, Exercise } from '../types/routine';
import { exercises as exerciseOptions } from '../data/mockData';

const WORKOUT_LABELS = ['A', 'B', 'C', 'D', 'E'];

function buildEmptyWorkouts(count: number): Workout[] {
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
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [workoutCount, setWorkoutCount] = useState(2);
  const [workouts, setWorkouts] = useState<Workout[]>(() => buildEmptyWorkouts(2));
  const [activeTab, setActiveTab] = useState('A');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const isEditing = !!routineId;

  useEffect(() => {
    if (!routineId) return;
    const saved: Routine[] = (() => {
      try {
        return JSON.parse(window.localStorage.getItem('personaltrainr.routines') ?? '[]');
      } catch {
        return [];
      }
    })();
    const routine = saved.find((r) => r.id === routineId);
    if (!routine) return;
    setName(routine.name);
    setGoal(routine.goal);
    setWorkoutCount(routine.workouts.length);
    setWorkouts(routine.workouts);
    setActiveTab(routine.workouts[0]?.day ?? 'A');
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

  function updateWorkout(index: number, patch: Partial<Workout>) {
    setWorkouts((prev) =>
      prev.map((w, i) => (i === index ? { ...w, ...patch } : w)),
    );
  }

  function addExercise(workoutIndex: number) {
    setWorkouts((prev) =>
      prev.map((w, i) =>
        i === workoutIndex
          ? { ...w, exercises: [...w.exercises, { name: '', series: 3, reps: 10, rest: 60 }] }
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
    patch: Partial<Exercise>,
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('saving');

    const saved: Routine[] = (() => {
      try {
        return JSON.parse(window.localStorage.getItem('personaltrainr.routines') ?? '[]');
      } catch {
        return [];
      }
    })();

    if (isEditing) {
      const updated = saved.map((r) =>
        r.id === routineId
          ? { ...r, name, goal, workouts }
          : r,
      );
      window.localStorage.setItem('personaltrainr.routines', JSON.stringify(updated));
    } else {
      const routine: Routine = {
        id: crypto.randomUUID(),
        name,
        goal,
        savedAsModel: true,
        createdAt: new Date().toISOString(),
        workouts,
      };
      window.localStorage.setItem(
        'personaltrainr.routines',
        JSON.stringify([...saved, routine]),
      );
    }

    setStatus('success');
  }

  const activeIndex = WORKOUT_LABELS.indexOf(activeTab);

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6 border-b border-border pb-6">
        <h1 className="font-title text-3xl uppercase text-text-primary">
          MONTAR NOVA ROTINA
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="grid gap-4 rounded-xl border border-border bg-card p-6 md:grid-cols-4">
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs uppercase text-text-secondary">
              Nome da Rotina
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase text-text-secondary">
              Objetivo
            </span>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
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
                        value={exercise.name}
                        onChange={(e) =>
                          updateExercise(activeIndex, ei, {
                            name: e.target.value,
                          })
                        }
                        className="w-full appearance-none rounded-lg border border-border bg-base p-3 pr-10 text-text-primary outline-none focus:border-accent"
                      >
                        <option value="">Selecione</option>
                        {exerciseOptions.map((opt) => (
                          <option key={opt.id} value={opt.name}>
                            {opt.name} ({opt.muscleGroup})
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
                      value={exercise.rest}
                      onChange={(e) =>
                        updateExercise(activeIndex, ei, {
                          rest: Number(e.target.value),
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

        {status === 'success' && (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-accent">
            {isEditing ? 'Rotina atualizada com sucesso.' : 'Rotina salva com sucesso.'}
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'saving'}
          className="block min-h-14 w-full rounded-lg bg-accent px-6 py-4 font-bold uppercase text-black transition disabled:cursor-wait disabled:opacity-70"
        >
          {status === 'saving' ? 'Salvando...' : isEditing ? 'ATUALIZAR ROTINA' : 'SALVAR ROTINA'}
        </button>
      </form>
    </section>
  );
}
