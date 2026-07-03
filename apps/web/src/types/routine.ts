export type Exercise = {
  name: string;
  series: number;
  reps: number;
  rest: number;
};

export type Workout = {
  day: string;
  description: string;
  exercises: Exercise[];
};

export type Routine = {
  id: string;
  name: string;
  goal: string;
  savedAsModel: boolean;
  createdAt: string;
  workouts: Workout[];
};

export type Assignment = {
  id: string;
  routineId: string;
  alunoId: string;
  assignedAt: string;
  expiresAt: string;
  isActive: boolean;
};

export type WorkoutLogEntry = {
  id: string;
  routineExerciseId: string;
  completedAt: string;
  weightUsed?: number | null;
};
