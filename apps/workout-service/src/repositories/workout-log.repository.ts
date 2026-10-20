import { prisma } from "../lib/prisma";
import type { WorkoutLog } from "../generated/prisma/client";

export const workoutLogRepository = {
  async create(data: {
    alunoId: string;
    routineExerciseId: string;
    exerciseId: string;
    weightUsed?: number | null;
  }): Promise<WorkoutLog> {
    return prisma.workoutLog.create({ data });
  },

  async findClientIds(clientIds: string[]): Promise<string[]> {
    const logs = await prisma.workoutLog.findMany({
      where: { clientId: { in: clientIds } },
      select: { clientId: true },
    });
    return logs.map((l) => l.clientId!);
  },

  // skipDuplicates cobre a corrida de dois envios simultâneos da mesma fila.
  async createManyFromClient(
    data: Array<{
      alunoId: string;
      clientId: string;
      routineExerciseId: string | null;
      exerciseId: string;
      weightUsed: number | null;
      completedAt: Date;
    }>,
  ): Promise<number> {
    const result = await prisma.workoutLog.createMany({ data, skipDuplicates: true });
    return result.count;
  },

  async findByAlunoId(alunoId: string): Promise<WorkoutLog[]> {
    return prisma.workoutLog.findMany({
      where: { alunoId },
      orderBy: { completedAt: "desc" },
    });
  },

  async findForProgress(alunoId: string, exerciseId?: string) {
    return prisma.workoutLog.findMany({
      where: { alunoId, exerciseId: exerciseId ?? { not: null } },
      orderBy: { completedAt: "asc" },
      select: {
        weightUsed: true,
        completedAt: true,
        exerciseId: true,
        exercise: { select: { name: true, muscle: true } },
      },
    });
  },
};
