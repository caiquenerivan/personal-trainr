"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workoutService = void 0;
const workout_log_repository_1 = require("../repositories/workout-log.repository");
const prisma_1 = require("../lib/prisma");
exports.workoutService = {
    async completeWorkout(alunoId, routineExerciseId, weightUsed) {
        const routineExercise = await prisma_1.prisma.routineExercise.findUnique({
            where: { id: routineExerciseId },
        });
        if (!routineExercise) {
            throw { status: 404, message: "Routine exercise not found" };
        }
        const log = await workout_log_repository_1.workoutLogRepository.create({
            alunoId,
            routineExerciseId,
            weightUsed,
        });
        return { log };
    },
    async getHistory(alunoId) {
        const logs = await workout_log_repository_1.workoutLogRepository.findByAlunoId(alunoId);
        return { logs };
    },
};
