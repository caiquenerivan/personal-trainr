import { prisma } from "../lib/prisma";
import type { WorkoutLog } from "../generated/prisma/client";

export const workoutLogRepository = {
  async create(data: { alunoId: string; routineExerciseId: string; weightUsed?: number | null }): Promise<WorkoutLog> {
    return prisma.workoutLog.create({ data });
  },

  async findByAlunoId(alunoId: string): Promise<WorkoutLog[]> {
    return prisma.workoutLog.findMany({
      where: { alunoId },
      orderBy: { completedAt: "desc" },
    });
  },
};
