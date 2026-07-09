"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workoutLogRepository = void 0;
const prisma_1 = require("../lib/prisma");
exports.workoutLogRepository = {
    async create(data) {
        return prisma_1.prisma.workoutLog.create({ data });
    },
    async findByAlunoId(alunoId) {
        return prisma_1.prisma.workoutLog.findMany({
            where: { alunoId },
            orderBy: { completedAt: "desc" },
        });
    },
};
