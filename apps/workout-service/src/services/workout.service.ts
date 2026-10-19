import { workoutLogRepository } from "../repositories/workout-log.repository";
import { prisma } from "../lib/prisma";

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
