import { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';

type ExerciseRow = {
  name: string;
  series: number;
  reps: number;
  rest: number;
  done: boolean;
  load: string;
};

type WorkoutBlock = {
  day: string;
  description: string;
  exercises: ExerciseRow[];
};

const MOCK_WORKOUTS: WorkoutBlock[] = [
  {
    day: 'A',
    description: 'Peito e Tríceps',
    exercises: [
      { name: 'Supino Reto', series: 4, reps: 10, rest: 60, done: false, load: '' },
      { name: 'Supino Inclinado', series: 3, reps: 12, rest: 45, done: false, load: '' },
      { name: 'Crucifixo', series: 3, reps: 12, rest: 45, done: false, load: '' },
      { name: 'Tríceps Pulley', series: 3, reps: 15, rest: 30, done: false, load: '' },
    ],
  },
  {
    day: 'B',
    description: 'Costas e Bíceps',
    exercises: [
      { name: 'Remada Curvada', series: 4, reps: 10, rest: 60, done: false, load: '' },
      { name: 'Puxada Alta', series: 3, reps: 12, rest: 45, done: false, load: '' },
      { name: 'Rosca Direta', series: 3, reps: 12, rest: 30, done: false, load: '' },
      { name: 'Rosca Martelo', series: 3, reps: 15, rest: 30, done: false, load: '' },
    ],
  },
];

export function MeuTreinoPage() {
  const [workouts, setWorkouts] = useState(MOCK_WORKOUTS);
  const [activeTab, setActiveTab] = useState('A');

  const activeWorkout = workouts.find((w) => w.day === activeTab);

  function toggleExercise(workoutIndex: number, exerciseIndex: number) {
    setWorkouts((prev) =>
      prev.map((w, wi) =>
        wi === workoutIndex
          ? {
              ...w,
              exercises: w.exercises.map((e, ei) =>
                ei === exerciseIndex ? { ...e, done: !e.done } : e,
              ),
            }
          : w,
      ),
    );
  }

  function updateLoad(workoutIndex: number, exerciseIndex: number, value: string) {
    setWorkouts((prev) =>
      prev.map((w, wi) =>
        wi === workoutIndex
          ? {
              ...w,
              exercises: w.exercises.map((e, ei) =>
                ei === exerciseIndex ? { ...e, load: value } : e,
              ),
            }
          : w,
      ),
    );
  }

  return (
    <section className="mx-auto max-w-7xl">
      <h1 className="font-title text-3xl uppercase text-text-primary">MEU TREINO</h1>

      <div className="mt-6 flex flex-wrap gap-5 border-b border-border">
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

      {activeWorkout && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="font-title text-xl uppercase tracking-wide text-accent">
            Treino {activeWorkout.day}
          </h2>
          {activeWorkout.description && (
            <p className="mt-1 text-sm text-text-secondary">{activeWorkout.description}</p>
          )}

          <div className="mt-5 space-y-3">
            {activeWorkout.exercises.map((exercise, ei) => {
              const wi = workouts.indexOf(activeWorkout);
              return (
                <div
                  key={ei}
                  className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 transition ${
                    exercise.done
                      ? 'border-green-500/30 bg-green-900/10'
                      : 'border-border bg-base'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleExercise(wi, ei)}
                    className="shrink-0 text-accent"
                  >
                    {exercise.done ? <CheckSquare size={22} /> : <Square size={22} />}
                  </button>

                  <span
                    className={`flex-1 font-body text-sm ${
                      exercise.done ? 'text-text-secondary line-through' : 'text-text-primary'
                    }`}
                  >
                    {exercise.name}
                  </span>

                  <span className="font-number text-sm text-accent">
                    {exercise.series}x
                  </span>
                  <span className="font-number text-sm text-accent">
                    {exercise.reps} reps
                  </span>
                  <span className="text-xs text-text-secondary">
                    {exercise.rest}s
                  </span>

                  <input
                    type="text"
                    value={exercise.load}
                    onChange={(e) => updateLoad(wi, ei, e.target.value)}
                    placeholder="Carga"
                    className="w-20 rounded-lg border border-border bg-menu px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h3 className="font-body text-sm uppercase text-text-secondary">Resumo</h3>
        <p className="mt-2 font-body text-text-primary">
          {activeWorkout
            ? `${activeWorkout.exercises.filter((e) => e.done).length} / ${activeWorkout.exercises.length} exercícios concluídos`
            : 'Selecione um treino para começar'}
        </p>
      </div>
    </section>
  );
}
