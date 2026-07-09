"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routineService = void 0;
const routine_repository_1 = require("../repositories/routine.repository");
const routine_assignment_repository_1 = require("../repositories/routine-assignment.repository");
const exercise_repository_1 = require("../repositories/exercise.repository");
exports.routineService = {
    async create(data) {
        const exerciseIds = data.exercises.map((e) => e.exerciseId);
        const existingExercises = await exercise_repository_1.exerciseRepository.findManyByIds(exerciseIds);
        const uniqueInputIds = new Set(exerciseIds);
        if (existingExercises.length !== uniqueInputIds.size) {
            throw { status: 400, message: "One or more exercises not found in database" };
        }
        const routine = await routine_repository_1.routineRepository.create({ trainerId: data.trainerId, name: data.name, type: data.type }, data.exercises);
        return { routine };
    },
    async assign(data) {
        const routine = await routine_repository_1.routineRepository.findById(data.routineId);
        if (!routine) {
            throw { status: 404, message: "Routine not found" };
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + data.days);
        const assignment = await routine_assignment_repository_1.routineAssignmentRepository.create({
            routineId: data.routineId,
            alunoId: data.alunoId,
            expiresAt,
        });
        return { assignment, routine };
    },
    async getStudentRoutine(alunoId) {
        const assignment = await routine_assignment_repository_1.routineAssignmentRepository.findActiveByAlunoId(alunoId);
        if (!assignment || !assignment.routine) {
            throw { status: 404, message: "No active routine found for this student" };
        }
        const groupedExercises = {};
        for (const ex of assignment.routine.exercises) {
            const day = ex.day;
            if (!groupedExercises[day])
                groupedExercises[day] = [];
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
