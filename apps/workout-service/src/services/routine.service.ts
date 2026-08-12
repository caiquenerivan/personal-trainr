import { routineRepository } from "../repositories/routine.repository";
import { routineAssignmentRepository } from "../repositories/routine-assignment.repository";
import { exerciseRepository } from "../repositories/exercise.repository";
import { prisma } from "../lib/prisma";
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
    const existingExercises = await exerciseRepository.findManyByIds(exerciseIds, data.trainerId);

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
    weeklyGoal: number;
    trainerId: string;
    routineName?: string;
    workouts?: Array<{
      day: string;
      description?: string;
      exercises: Array<{
        name: string;
        series: number;
        reps: number;
        rest: number;
      }>;
    }>;
  }) {
    const connection = await prisma.trainerStudentConnection.findUnique({
      where: {
        trainerId_studentId: {
          trainerId: data.trainerId,
          studentId: data.alunoId,
        },
      },
    });

    if (!connection || connection.status !== "ACTIVE") {
      throw { status: 403, message: "Você não tem permissão para atribuir treino a este aluno" };
    }

    let routine = await routineRepository.findById(data.routineId);
    if (routine && routine.trainerId !== data.trainerId) {
      throw { status: 403, message: "Você não tem permissão para atribuir esta rotina" };
    }
    if (!routine) {
      if (!data.routineName) {
        throw { status: 404, message: "Routine not found" };
      }

      if (data.workouts && data.workouts.length > 0) {
        const typeMap: Record<number, RoutineType> = {
          2: "AB", 3: "ABC", 4: "ABCD", 5: "ABCDE",
        };
        const routineType = typeMap[data.workouts.length] || "AB";

        const exercises: Array<{
          exerciseId: string;
          day: Day;
          dayDescription?: string;
          series: number;
          reps: number;
          restTime: number;
        }> = [];

        for (const w of data.workouts) {
          for (const ex of w.exercises) {
            let dbExercise = await exerciseRepository.findByName(ex.name, data.trainerId);
            if (!dbExercise) {
              dbExercise = await exerciseRepository.create({ name: ex.name, trainerId: data.trainerId });
            }
            exercises.push({
              exerciseId: dbExercise.id,
              day: w.day as Day,
              dayDescription: w.description || undefined,
              series: ex.series,
              reps: ex.reps,
              restTime: ex.rest,
            });
          }
        }

        routine = await routineRepository.create(
          { trainerId: data.trainerId, name: data.routineName, type: routineType },
          exercises,
        );
      } else {
        routine = await routineRepository.create(
          { trainerId: data.trainerId, name: data.routineName, type: "AB" },
          [],
        );
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.days);

    const assignment = await routineAssignmentRepository.create({
      routineId: routine.id,
      alunoId: data.alunoId,
      weeklyGoal: data.weeklyGoal,
      expiresAt,
    });

    return { assignment, routine };
  },

  async listByTrainer(trainerId: string) {
    const routines = await routineRepository.findByTrainerId(trainerId);
    return {
      routines: routines.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        createdAt: r.createdAt,
      })),
    };
  },

  async getById(id: string, trainerId: string) {
    const routine = await routineRepository.findById(id);
    if (!routine) {
      throw { status: 404, message: "Rotina não encontrada" };
    }
    if (routine.trainerId !== trainerId) {
      throw { status: 403, message: "Você não pode ver esta rotina" };
    }
    return { routine };
  },

  async update(
    id: string,
    trainerId: string,
    data: {
      name: string;
      type: RoutineType;
      exercises: Array<{
        exerciseId: string;
        day: Day;
        dayDescription?: string;
        series: number;
        reps: number;
        restTime: number;
      }>;
    },
  ) {
    const existing = await routineRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: "Rotina não encontrada" };
    }
    if (existing.trainerId !== trainerId) {
      throw { status: 403, message: "Você não pode editar esta rotina" };
    }

    const exerciseIds = data.exercises.map((e) => e.exerciseId);
    const existingExercises = await exerciseRepository.findManyByIds(exerciseIds, trainerId);
    const uniqueInputIds = new Set(exerciseIds);
    if (existingExercises.length !== uniqueInputIds.size) {
      throw { status: 400, message: "One or more exercises not found in database" };
    }

    const routine = await routineRepository.update(
      id,
      { name: data.name, type: data.type },
      data.exercises,
    );
    return { routine };
  },

  async remove(id: string, trainerId: string) {
    const existing = await routineRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: "Rotina não encontrada" };
    }
    if (existing.trainerId !== trainerId) {
      throw { status: 403, message: "Você não pode remover esta rotina" };
    }

    const activeAssignments = await routineAssignmentRepository.countActiveByRoutineId(id);
    if (activeAssignments > 0) {
      throw { status: 409, message: "Esta rotina está vinculada a um ou mais alunos e não pode ser removida" };
    }

    await routineRepository.delete(id);
  },

  async listByStudent(alunoId: string) {
    const assignments = await routineAssignmentRepository.findAllByAlunoId(alunoId);
    const now = new Date();
    return {
      assignments: assignments.map((a) => ({
        id: a.id,
        routineId: a.routineId,
        routineName: a.routine.name,
        routineType: a.routine.type,
        weeklyGoal: a.weeklyGoal,
        assignedAt: a.assignedAt,
        expiresAt: a.expiresAt,
        isActive: a.isActive && a.expiresAt > now,
      })),
    };
  },

  async getStudentRoutine(alunoId: string) {
    const assignment = await routineAssignmentRepository.findActiveByAlunoId(alunoId);

    if (!assignment || !assignment.routine) {
      throw { status: 404, message: "No active routine found for this student" };
    }

    const groupedExercises: Record<string, typeof assignment.routine.exercises> = {};
    const dayDescriptions: Record<string, string | null> = {};
    for (const ex of assignment.routine.exercises) {
      const day = ex.day;
      if (!groupedExercises[day]) groupedExercises[day] = [];
      groupedExercises[day].push(ex);
      if (!dayDescriptions[day]) dayDescriptions[day] = ex.dayDescription ?? null;
    }

    return {
      id: assignment.routine.id,
      name: assignment.routine.name,
      type: assignment.routine.type,
      trainerId: assignment.routine.trainerId,
      weeklyGoal: assignment.weeklyGoal,
      expiresAt: assignment.expiresAt,
      assignedAt: assignment.assignedAt,
      createdAt: assignment.routine.createdAt,
      exercises: groupedExercises,
      dayDescriptions,
    };
  },
};
