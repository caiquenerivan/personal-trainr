"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routineRepository = void 0;
const prisma_1 = require("../lib/prisma");
exports.routineRepository = {
    async create(data, exercises) {
        return prisma_1.prisma.$transaction(async (tx) => {
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
            });
        });
    },
    async findById(id) {
        return prisma_1.prisma.routine.findUnique({
            where: { id },
            include: {
                exercises: {
                    include: { exercise: true },
                },
            },
        });
    },
    async delete(id) {
        await prisma_1.prisma.routine.delete({ where: { id } });
    },
};
