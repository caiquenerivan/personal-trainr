"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routineAssignmentRepository = void 0;
const prisma_1 = require("../lib/prisma");
const routine_repository_1 = require("./routine.repository");
exports.routineAssignmentRepository = {
    async create(data) {
        return prisma_1.prisma.routineAssignment.create({ data });
    },
    async findActiveByAlunoId(alunoId) {
        const assignment = await prisma_1.prisma.routineAssignment.findFirst({
            where: {
                alunoId,
                isActive: true,
                expiresAt: { gt: new Date() },
            },
            orderBy: { assignedAt: "desc" },
        });
        if (!assignment)
            return null;
        const routine = await routine_repository_1.routineRepository.findById(assignment.routineId);
        return { ...assignment, routine };
    },
    async deactivateExpired() {
        await prisma_1.prisma.routineAssignment.updateMany({
            where: {
                isActive: true,
                expiresAt: { lte: new Date() },
            },
            data: { isActive: false },
        });
    },
};
