import { prisma } from "../lib/prisma";
import type { Routine, RoutineType, Day } from "../generated/prisma/client";

export interface CreateRoutineData {
  trainerId: string;
  name: string;
  type: RoutineType;
}

export interface CreateRoutineExerciseData {
  exerciseId: string;
  day: Day;
  series: number;
  reps: number;
  restTime: number;
}

export interface RoutineWithExercises extends Routine {
  exercises: Array<{
    id: string;
    day: Day;
    series: number;
    reps: number;
    restTime: number;
    exercise: {
      id: string;
      name: string;
      videoUrl: string | null;
      gifUrl: string | null;
      muscle: string | null;
      weightTrack: string | null;
      observations: string | null;
    };
  }>;
}

export const routineRepository = {
  async create(data: CreateRoutineData, exercises: CreateRoutineExerciseData[]): Promise<RoutineWithExercises> {
    return prisma.$transaction(async (tx) => {
      return tx.routine.create({
        data: {
          trainerId: data.trainerId,
          name: data.name,
          type: data.type,
          exercises: {
            create: exercises.map((e) => ({
              exerciseId: e.exerciseId,
              day: e.day,
              series: e.series,
              reps: e.reps,
              restTime: e.restTime,
            })),
          },
        },
        include: {
          exercises: {
            include: { exercise: true },
          },
        },
      }) as Promise<RoutineWithExercises>;
    });
  },

  async findById(id: string): Promise<RoutineWithExercises | null> {
    return prisma.routine.findUnique({
      where: { id },
      include: {
        exercises: {
          include: { exercise: true },
        },
      },
    }) as Promise<RoutineWithExercises | null>;
  },

  async findByTrainerId(trainerId: string): Promise<RoutineWithExercises[]> {
    return prisma.routine.findMany({
      where: { trainerId },
      include: {
        exercises: {
          include: { exercise: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }) as Promise<RoutineWithExercises[]>;
  },

  async delete(id: string): Promise<void> {
    await prisma.routine.delete({ where: { id } });
  },
};
