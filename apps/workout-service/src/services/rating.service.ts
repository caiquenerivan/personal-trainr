import { prisma } from "../lib/prisma";
import { ratingRepository } from "../repositories/rating.repository";

function round2(value: number | null): number | null {
  if (value == null) return null;
  return Math.round(value * 100) / 100;
}

export const ratingService = {
  async rate(studentId: string, trainerId: string, rating: number) {
    const connection = await prisma.trainerStudentConnection.findFirst({
      where: { studentId, trainerId, status: "ACTIVE" },
    });
    if (!connection) {
      throw { status: 403, message: "Você precisa estar vinculado a este personal para avaliá-lo" };
    }

    await ratingRepository.upsert(trainerId, studentId, rating);
    return this.getForTrainer(trainerId, studentId);
  },

  async getForTrainer(trainerId: string, studentId?: string) {
    const { average, count } = await ratingRepository.getAggregateForTrainer(trainerId);
    let myRating: number | null = null;
    if (studentId) {
      const mine = await ratingRepository.findByTrainerAndStudent(trainerId, studentId);
      myRating = mine?.rating ?? null;
    }
    return { average: round2(average), count, myRating };
  },
};
