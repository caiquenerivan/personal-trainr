import { useEffect, useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { getMyRoutine, completeExercise } from '../api/student';
import { Modal } from '../components/Modal';

type ExerciseDetail = {
  id: string;
  name: string;
  series: number;
  reps: number;
  restTime: number;
  exercise: {
    id: string;
    name: string;
    videoUrl?: string | null;
    gifUrl?: string | null;
    muscle?: string | null;
    observations?: string | null;
  };
};

type RoutineData = {
  id: string;
  name: string;
  type: string;
  trainerId: string;
  expiresAt: string;
  exercises: Record<string, ExerciseDetail[]>;
};

type ExerciseRow = {
  routineExerciseId: string;
  name: string;
  muscleGroup: string;
  series: number;
  reps: number;
  restTime: number;
  gifUrl?: string | null;
  videoUrl?: string | null;
  observations?: string | null;
  done: boolean;
  weight: string;
};

type WorkoutBlock = {
  day: string;
  exercises: ExerciseRow[];
};

export function StudentTreinoHojePage() {
  const [routine, setRoutine] = useState<RoutineData | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutBlock[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailTarget, setDetailTarget] = useState<ExerciseRow | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    getMyRoutine()
      .then((data: RoutineData) => {
        setRoutine(data);
        const blocks: WorkoutBlock[] = Object.entries(data.exercises).map(
          ([day, exercises]) => ({
            day,
            exercises: exercises.map((ex) => ({
              routineExerciseId: ex.id,
              name: ex.exercise.name,
              muscleGroup: ex.exercise.muscle ?? '',
              series: ex.series,
              reps: ex.reps,
              restTime: ex.restTime,
              gifUrl: ex.exercise.gifUrl,
              videoUrl: ex.exercise.videoUrl,
              observations: ex.exercise.observations,
              done: false,
              weight: '',
            })),
          }),
        );
        setWorkouts(blocks);
        const days = Object.keys(data.exercises);
        setActiveTab(days[0] ?? '');
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const activeWorkout = workouts.find((w) => w.day === activeTab);

  function toggleExercise(wi: number, ei: number) {
    const exercise = workouts[wi].exercises[ei];
    if (!exercise.done) {
      setSaving(`${wi}-${ei}`);
      completeExercise(
        exercise.routineExerciseId,
        exercise.weight ? Number(exercise.weight) : null,
      )
        .then(() => {
          setWorkouts((prev) =>
            prev.map((w, i) =>
              i === wi
                ? {
                    ...w,
                    exercises: w.exercises.map((e, j) =>
                      j === ei ? { ...e, done: true } : e,
                    ),
                  }
                : w,
            ),
          );
          setSaving(null);
        })
        .catch(() => setSaving(null));
    }
  }

  function updateWeight(wi: number, ei: number, value: string) {
    setWorkouts((prev) =>
      prev.map((w, i) =>
        i === wi
          ? {
              ...w,
              exercises: w.exercises.map((e, j) =>
                j === ei ? { ...e, weight: value } : e,
              ),
            }
          : w,
      ),
    );
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl">
        <p className="font-body text-text-secondary">Carregando treino do dia...</p>
      </section>
    );
  }

  if (!routine) {
    return (
      <section className="mx-auto max-w-7xl">
        <h1 className="font-title text-3xl uppercase text-text-primary">TREINO DE HOJE</h1>
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <p className="font-body text-text-secondary">
            Nenhuma rotina ativa encontrada. Consulte seu personal trainer.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl">
      <h1 className="font-title text-3xl uppercase text-text-primary">TREINO DE HOJE</h1>
      <p className="mt-1 text-sm text-text-secondary">{routine.name}</p>

      <div className="mt-6 flex flex-wrap gap-5 border-b border-border">
        {workouts.map((w) => {
          const isActive = activeTab === w.day;
          const allDone = w.exercises.length > 0 && w.exercises.every((e) => e.done);
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
              {allDone && <span className="ml-2 text-green-400">✓</span>}
            </button>
          );
        })}
      </div>

      {activeWorkout && (
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <div className="space-y-3">
            {activeWorkout.exercises.map((exercise, ei) => {
              const wi = workouts.indexOf(activeWorkout);
              const isSaving = saving === `${wi}-${ei}`;
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
                    disabled={exercise.done || isSaving}
                    className={`shrink-0 transition ${
                      exercise.done ? 'text-green-400' : 'text-accent hover:text-accent/80'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {exercise.done ? <CheckSquare size={22} /> : <Square size={22} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailTarget(exercise)}
                    className={`flex-1 text-left font-body text-sm transition hover:text-accent ${
                      exercise.done ? 'text-text-secondary line-through' : 'text-text-primary'
                    }`}
                  >
                    {exercise.name}
                  </button>

                  <span className="font-number text-sm text-accent">
                    {exercise.series}x
                  </span>
                  <span className="font-number text-sm text-accent">
                    {exercise.reps} reps
                  </span>
                  <span className="text-xs text-text-secondary">
                    {exercise.restTime}s
                  </span>

                  <input
                    type="text"
                    value={exercise.weight}
                    onChange={(e) => updateWeight(wi, ei, e.target.value)}
                    placeholder="Carga"
                    disabled={exercise.done}
                    className="w-20 rounded-lg border border-border bg-menu px-3 py-2 text-xs text-text-primary outline-none focus:border-accent disabled:opacity-50"
                  />

                  {isSaving && (
                    <span className="text-xs text-accent">Salvando...</span>
                  )}
                </div>
              );
            })}
          </div>

          {activeWorkout.exercises.length === 0 && (
            <p className="font-body text-sm text-text-secondary">
              Nenhum exercício cadastrado para este treino.
            </p>
          )}
        </div>
      )}

      <Modal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title="Detalhes do Exercício"
      >
        {detailTarget && (
          <div className="space-y-4">
            <h3 className="font-title text-lg uppercase text-text-primary">
              {detailTarget.name}
            </h3>
            {detailTarget.muscleGroup && (
              <p className="text-sm text-text-secondary">
                Grupo muscular: {detailTarget.muscleGroup}
              </p>
            )}

            {detailTarget.gifUrl && (
              <div className="overflow-hidden rounded-lg bg-base">
                <img
                  src={detailTarget.gifUrl}
                  alt={detailTarget.name}
                  loading="lazy"
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
