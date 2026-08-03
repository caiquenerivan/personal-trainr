import { prisma } from "../lib/prisma";

export const ratingRepository = {
  async upsert(trainerId: string, studentId: string, rating: number) {
    return prisma.trainerRating.upsert({
      where: { trainerId_studentId: { trainerId, studentId } },
      create: { trainerId, studentId, rating },
      update: { rating },
    });
  },

  async findByTrainerAndStudent(trainerId: string, studentId: string) {
    return prisma.trainerRating.findUnique({
      where: { trainerId_studentId: { trainerId, studentId } },
    });
  },

  async getAggregateForTrainer(trainerId: string) {
    const result = await prisma.trainerRating.aggregate({
      where: { trainerId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return { average: result._avg.rating, count: result._count.rating };
  },

  async getAggregatesForTrainers(trainerIds: string[]) {
    const results = await prisma.trainerRating.groupBy({
      by: ["trainerId"],
      where: { trainerId: { in: trainerIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const map = new Map<string, { average: number | null; count: number }>();
    for (const r of results) {
      map.set(r.trainerId, { average: r._avg.rating, count: r._count.rating });
    }
    return map;
  },
};
