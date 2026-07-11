import { prisma } from "../lib/prisma";
import type { Exercise } from "../generated/prisma/client";

export interface CreateExerciseData {
  name: string;
  videoUrl?: string | null;
  gifUrl?: string | null;
  muscle?: string | null;
  weightTrack?: string | null;
  observations?: string | null;
}

export const exerciseRepository = {
  async create(data: CreateExerciseData): Promise<Exercise> {
    return prisma.exercise.create({ data });
  },

  async findById(id: string): Promise<Exercise | null> {
    return prisma.exercise.findUnique({ where: { id } });
  },

  async findByName(name: string): Promise<Exercise | null> {
    return prisma.exercise.findFirst({ where: { name } });
  },

  async findManyByIds(ids: string[]): Promise<Exercise[]> {
    return prisma.exercise.findMany({ where: { id: { in: ids } } });
  },

  async list(): Promise<Exercise[]> {
    return prisma.exercise.findMany({ orderBy: { name: "asc" } });
  },
};
