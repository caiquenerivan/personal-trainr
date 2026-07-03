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

    const log = await workoutLogRepository.create({
      alunoId,
      routineExerciseId,
      weightUsed,
    });

    return { log };
  },

  async getHistory(alunoId: string) {
    const logs = await workoutLogRepository.findByAlunoId(alunoId);
    return { logs };
  },
};
