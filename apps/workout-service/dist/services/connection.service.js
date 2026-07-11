"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionService = void 0;
const prisma_1 = require("../lib/prisma");
exports.connectionService = {
    async create(data) {
        const existingConnection = await prisma_1.prisma.trainerStudentConnection.findUnique({
            where: {
                trainerId_studentId: {
                    trainerId: data.trainerId,
                    studentId: data.studentId,
                },
            },
        });
        if (existingConnection) {
            throw { status: 409, message: "Conexão já existe" };
        }
        const trainer = await prisma_1.prisma.user.findFirst({
            where: {
                id: data.trainerId,
                role: "TRAINER",
            },
            select: {
                id: true,
            },
        });
        if (!trainer) {
            throw { status: 404, message: "Personal não encontrado" };
        }
        const connection = await prisma_1.prisma.trainerStudentConnection.create({
            data: {
                trainerId: data.trainerId,
                studentId: data.studentId,
                status: "ACTIVE",
            },
        });
        return { connection };
    },
};
