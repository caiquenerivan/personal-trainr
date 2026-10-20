export type Day = 'A' | 'B' | 'C' | 'D' | 'E';

export type Exercise = {
  id: string;
  name: string;
  muscle?: string | null;
  gifUrl?: string | null;
  videoUrl?: string | null;
  observations?: string | null;
};

export type RoutineExercise = {
  id: string;
  exerciseId: string;
  day: Day;
  dayDescription?: string | null;
  series: number;
  reps: number;
  restTime: number;
  exercise: Exercise;
};

// Resposta de GET /api/my-routine (rotina ativa, exercícios agrupados por dia).
export type MyRoutine = {
  id: string;
  name: string;
  type: string;
  trainerId: string;
  weeklyGoal: number;
  expiresAt: string;
  assignedAt: string;
  exercises: Partial<Record<Day, RoutineExercise[]>>;
  dayDescriptions?: Partial<Record<Day, string | null>>;
};

export type WorkoutLog = {
  id: string;
  alunoId: string;
  routineExerciseId: string | null;
  exerciseId: string | null;
  weightUsed: number | null;
  completedAt: string;
  clientId?: string | null;
};

export type StudentDashboard = {
  weeklyStreak: number;
  assignment: {
    id: string;
    routineId: string;
    weeklyGoal: number;
    expiresAt: string;
    assignedAt: string;
  } | null;
};

// Exercício concluído no app, enviado em lote por POST /api/workout/sync.
export type ClientWorkoutLog = {
  clientId: string;
  routineExerciseId: string;
  exerciseId: string;
  weightUsed?: number | null;
  completedAt: string;
};

export type SyncResult = {
  clientId: string;
  status: 'saved' | 'duplicate' | 'rejected';
  reason?: string;
};

export type LoadPoint = { weight: number; date: string };

export type ExerciseLoadSummary = {
  exerciseId: string;
  name: string;
  muscle: string | null;
  sessions: number;
  first: LoadPoint | null;
  last: LoadPoint | null;
  maxWeight: number | null;
  lastDoneAt: string;
};

export type ExerciseLoadHistory = {
  exerciseId: string;
  name: string | null;
  points: Array<{ date: string; weight: number | null }>;
};
