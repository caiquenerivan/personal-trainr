import { routineRepository } from "../repositories/routine.repository";
import { routineAssignmentRepository } from "../repositories/routine-assignment.repository";
import { exerciseRepository } from "../repositories/exercise.repository";
import type { Day, RoutineType } from "../generated/prisma/client";

export const routineService = {
  async create(data: {
    trainerId: string;
    name: string;
    type: RoutineType;
    exercises: Array<{
      exerciseId: string;
      day: Day;
      series: number;
      reps: number;
      restTime: number;
    }>;
  }) {
    const exerciseIds = data.exercises.map((e) => e.exerciseId);
    const existingExercises = await exerciseRepository.findManyByIds(exerciseIds);

    const uniqueInputIds = new Set(exerciseIds);
    if (existingExercises.length !== uniqueInputIds.size) {
      throw { status: 400, message: "One or more exercises not found in database" };
    }

    const routine = await routineRepository.create(
      { trainerId: data.trainerId, name: data.name, type: data.type },
      data.exercises,
    );

    return { routine };
  },

  async assign(data: {
    routineId: string;
    alunoId: string;
    days: number;
  }) {
    const routine = await routineRepository.findById(data.routineId);
    if (!routine) {
      throw { status: 404, message: "Routine not found" };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.days);

    const assignment = await routineAssignmentRepository.create({
      routineId: data.routineId,
      alunoId: data.alunoId,
      expiresAt,
    });

    return { assignment, routine };
  },

  async getStudentRoutine(alunoId: string) {
    const assignment = await routineAssignmentRepository.findActiveByAlunoId(alunoId);

    if (!assignment || !assignment.routine) {
      throw { status: 404, message: "No active routine found for this student" };
    }

    const groupedExercises: Record<string, typeof assignment.routine.exercises> = {};
    for (const ex of assignment.routine.exercises) {
      const day = ex.day;
      if (!groupedExercises[day]) groupedExercises[day] = [];
      groupedExercises[day].push(ex);
    }

    return {
      id: assignment.routine.id,
      name: assignment.routine.name,
      type: assignment.routine.type,
      trainerId: assignment.routine.trainerId,
      expiresAt: assignment.expiresAt,
      assignedAt: assignment.assignedAt,
      createdAt: assignment.routine.createdAt,
      exercises: groupedExercises,
    };
  },
};
