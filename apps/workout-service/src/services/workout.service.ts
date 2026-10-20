import { workoutLogRepository } from "../repositories/workout-log.repository";
import { prisma } from "../lib/prisma";

// Limites para o completedAt vindo do aparelho: tolera relógio um pouco
// adiantado e descarta registros velhos demais para serem um treino real
// esperando sinal.
const CLOCK_SKEW_MS = 5 * 60 * 1000;
const MAX_OFFLINE_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type ClientWorkoutLog = {
  clientId: string;
  routineExerciseId: string;
  exerciseId: string;
  weightUsed?: number | null;
  completedAt: string;
};

export type SyncResult = {
  clientId: string;
  status: "saved" | "duplicate" | "rejected";
  reason?: string;
};

export const workoutService = {
  async completeWorkout(alunoId: string, routineExerciseId: string, weightUsed?: number | null) {
    const routineExercise = await prisma.routineExercise.findUnique({
      where: { id: routineExerciseId },
    });

    if (!routineExercise) {
      throw { status: 404, message: "Routine exercise not found" };
    }

    const assignment = await prisma.routineAssignment.findFirst({
      where: {
        routineId: routineExercise.routineId,
        alunoId,
        isActive: true,
      },
    });

    if (!assignment) {
      throw { status: 403, message: "Este exercício não pertence a uma rotina atribuída a você" };
    }

    const log = await workoutLogRepository.create({
      alunoId,
      routineExerciseId,
      exerciseId: routineExercise.exerciseId,
      weightUsed,
    });

    return { log };
  },

  // Recebe a fila de exercícios concluídos offline pelo app. Cada item é
  // resolvido de forma independente: um rejeitado não impede os demais, e o
  // app descarta da fila tudo que voltar como saved/duplicate/rejected.
  async syncWorkoutLogs(alunoId: string, items: ClientWorkoutLog[]): Promise<{ results: SyncResult[] }> {
    const results: SyncResult[] = [];
    const seen = new Set<string>();
    const existing = new Set(await workoutLogRepository.findClientIds(items.map((i) => i.clientId)));

    const routineExerciseIds = [...new Set(items.map((i) => i.routineExerciseId))];
    const exerciseIds = [...new Set(items.map((i) => i.exerciseId))];
    const [routineExercises, exercises, assignments] = await Promise.all([
      prisma.routineExercise.findMany({ where: { id: { in: routineExerciseIds } } }),
      prisma.exercise.findMany({ where: { id: { in: exerciseIds } }, select: { id: true } }),
      // Sem filtrar isActive: o treino pode ter sido feito antes de o personal
      // trocar a rotina, e só chegar aqui depois.
      prisma.routineAssignment.findMany({ where: { alunoId }, select: { routineId: true } }),
    ]);
    const routineExerciseById = new Map(routineExercises.map((re) => [re.id, re]));
    const existingExerciseIds = new Set(exercises.map((e) => e.id));
    const assignedRoutineIds = new Set(assignments.map((a) => a.routineId));

    const now = Date.now();
    const toCreate: Parameters<typeof workoutLogRepository.createManyFromClient>[0] = [];

    for (const item of items) {
      if (existing.has(item.clientId) || seen.has(item.clientId)) {
        results.push({ clientId: item.clientId, status: "duplicate" });
        continue;
      }
      seen.add(item.clientId);

      const completedAtMs = new Date(item.completedAt).getTime();
      if (Number.isNaN(completedAtMs) || completedAtMs < now - MAX_OFFLINE_AGE_MS) {
        results.push({ clientId: item.clientId, status: "rejected", reason: "completedAt fora do intervalo" });
        continue;
      }

      const routineExercise = routineExerciseById.get(item.routineExerciseId);
      let routineExerciseId: string | null = null;
      let exerciseId: string;

      if (routineExercise) {
        if (!assignedRoutineIds.has(routineExercise.routineId)) {
          results.push({ clientId: item.clientId, status: "rejected", reason: "Rotina não atribuída a você" });
          continue;
        }
        routineExerciseId = routineExercise.id;
        exerciseId = routineExercise.exerciseId;
      } else if (existingExerciseIds.has(item.exerciseId)) {
        // A rotina foi editada enquanto o app estava offline (a edição recria
        // os RoutineExercise): guarda só o exercício, como o histórico de carga.
        exerciseId = item.exerciseId;
      } else {
        results.push({ clientId: item.clientId, status: "rejected", reason: "Exercício não encontrado" });
        continue;
      }

      toCreate.push({
        alunoId,
        clientId: item.clientId,
        routineExerciseId,
        exerciseId,
        weightUsed: item.weightUsed ?? null,
        completedAt: new Date(Math.min(completedAtMs, now + CLOCK_SKEW_MS)),
      });
      results.push({ clientId: item.clientId, status: "saved" });
    }

    if (toCreate.length > 0) {
      await workoutLogRepository.createManyFromClient(toCreate);
    }

    return { results };
  },

  async getHistory(alunoId: string) {
    const logs = await workoutLogRepository.findByAlunoId(alunoId);
    return { logs };
  },

  async assertTrainerOfStudent(trainerId: string, alunoId: string) {
    const connection = await prisma.trainerStudentConnection.findUnique({
      where: { trainerId_studentId: { trainerId, studentId: alunoId } },
    });
    if (!connection || connection.status !== "ACTIVE") {
      throw { status: 403, message: "Você não tem acesso ao progresso deste aluno" };
    }
  },

  // Evolução de carga: por exercício, a primeira e a última carga registradas, a maior e quantas vezes foi feito.
  async getProgressSummary(alunoId: string) {
    const logs = await workoutLogRepository.findForProgress(alunoId);
    const byExercise = new Map<string, ProgressSummary>();
    for (const log of logs) {
      if (!log.exerciseId) continue;
      let s = byExercise.get(log.exerciseId);
      if (!s) {
        s = {
          exerciseId: log.exerciseId,
          name: log.exercise?.name ?? "",
          muscle: log.exercise?.muscle ?? null,
          sessions: 0,
          first: null,
          last: null,
          maxWeight: null,
          lastDoneAt: log.completedAt,
        };
        byExercise.set(log.exerciseId, s);
      }
      s.sessions += 1;
      s.lastDoneAt = log.completedAt;
      if (log.weightUsed != null) {
        const point = { weight: log.weightUsed, date: log.completedAt };
        if (!s.first) s.first = point;
        s.last = point;
        s.maxWeight = Math.max(s.maxWeight ?? 0, log.weightUsed);
      }
    }
    const exercises = [...byExercise.values()].sort((a, b) => b.lastDoneAt.getTime() - a.lastDoneAt.getTime());
    return { exercises };
  },

  // Série de cargas de um exercício ao longo do tempo (para o gráfico de antes e depois).
  async getExerciseProgress(alunoId: string, exerciseId: string) {
    const logs = await workoutLogRepository.findForProgress(alunoId, exerciseId);
    return {
      exerciseId,
      name: logs[0]?.exercise?.name ?? null,
      points: logs.map((l) => ({ date: l.completedAt, weight: l.weightUsed })),
    };
  },
};

type ProgressSummary = {
  exerciseId: string;
  name: string;
  muscle: string | null;
  sessions: number;
  first: { weight: number; date: Date } | null;
  last: { weight: number; date: Date } | null;
  maxWeight: number | null;
  lastDoneAt: Date;
};
