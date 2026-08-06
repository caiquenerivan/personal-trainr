import { prisma } from "../lib/prisma";
import type { Exercise } from "../generated/prisma/client";

export interface CreateExerciseData {
  trainerId: string;
  name: string;
  videoUrl?: string | null;
  gifUrl?: string | null;
  muscle?: string | null;
  weightTrack?: string | null;
  observations?: string | null;
}

export interface UpdateExerciseData {
  name?: string;
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

  // Only matches exercises visible to this trainer (their own or global),
  // so a trainer can't silently attach/reuse another trainer's exercise.
  async findByName(name: string, trainerId: string): Promise<Exercise | null> {
    return prisma.exercise.findFirst({ where: { name, OR: [{ trainerId: null }, { trainerId }] } });
  },

  // Only returns exercises visible to this trainer (their own or global).
  async findManyByIds(ids: string[], trainerId: string): Promise<Exercise[]> {
    return prisma.exercise.findMany({
      where: { id: { in: ids }, OR: [{ trainerId: null }, { trainerId }] },
    });
  },

  // Visible to a trainer: global (admin-created) exercises plus their own.
  async list(trainerId: string): Promise<Exercise[]> {
    return prisma.exercise.findMany({
      where: { OR: [{ trainerId: null }, { trainerId }] },
      orderBy: { name: "asc" },
    });
  },

  async update(id: string, data: UpdateExerciseData): Promise<Exercise> {
    return prisma.exercise.update({ where: { id }, data });
  },

  async remove(id: string): Promise<void> {
    await prisma.exercise.delete({ where: { id } });
  },
};
