import type { Day, Exercise } from './workout';

export type RoutineType = 'AB' | 'ABC' | 'ABCD' | 'ABCDE';

export type PlanTier = 'FREE' | 'PRO' | 'UNLIMITED';

export type Subscription = {
  plan: PlanTier;
  status: string;
  studentLimit: number | null;
  currentPeriodEnd: string | null;
};

export type TrainerDashboard = {
  activeStudentsCount: number;
  workoutsLast7Days: number;
  routinesInUseCount: number;
  adhesionRate: number;
  activeStudentsList: {
    id: string;
    name: string;
    avatarUrl: string | null;
    routineName: string | null;
    connectedAt: string;
  }[];
  mostUsedRoutines: { id: string; name: string; type: string | null; studentsUsing: number }[];
  recentActivity: {
    id: string;
    studentUsername: string;
    studentAvatar: string | null;
    routineName: string | null;
    workoutLetter: string | null;
    exerciseName: string | null;
    completedAt: string;
  }[];
};

export type TrainerStudent = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  weight: number | null;
  height: number | null;
  birthDate: string | null;
  bio: string | null;
  hasActiveRoutine: boolean;
  routineName: string | null;
  expiresAt: string | null;
};

export type StudentProgress = {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  connectionStatus: 'ACTIVE' | 'INACTIVE';
  weeklyGoal: number;
  workoutsLast7Days: number;
  weeklyStreak: number;
  adhesionRate: number;
};

export type RoutineSummary = {
  id: string;
  name: string;
  type: RoutineType;
  createdAt: string;
};

export type CatalogExercise = Exercise & {
  trainerId: string | null;
  weightTrack?: string | null;
};

export type RoutineDetail = {
  id: string;
  trainerId: string;
  name: string;
  type: RoutineType;
  createdAt: string;
  exercises: {
    id: string;
    day: Day;
    dayDescription: string | null;
    series: number;
    reps: number;
    restTime: number;
    exercise: CatalogExercise;
  }[];
};

export type RoutinePayload = {
  name: string;
  type: RoutineType;
  exercises: {
    exerciseId: string;
    day: Day;
    dayDescription?: string;
    series: number;
    reps: number;
    restTime: number;
  }[];
};

export type AssignRoutinePayload = {
  routineId: string;
  alunoId: string;
  days: number;
  weeklyGoal: number;
};

export type ExercisePayload = {
  name: string;
  muscle?: string | null;
  videoUrl?: string | null;
  gifUrl?: string | null;
  observations?: string | null;
};
