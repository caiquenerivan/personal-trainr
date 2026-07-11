"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trainerService = void 0;
const prisma_1 = require("../lib/prisma");
exports.trainerService = {
    async search(q) {
        const trainers = await prisma_1.prisma.user.findMany({
            where: {
                role: "TRAINER",
                OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { username: { contains: q, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
                bio: true,
                trainerProfile: {
                    select: {
                        specialties: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
            take: 20,
        });
        return {
            trainers: trainers.map((trainer) => ({
                id: trainer.id,
                name: trainer.name,
                username: trainer.username,
                avatarUrl: trainer.avatarUrl,
                bio: trainer.bio,
                especialidades: trainer.trainerProfile?.specialties ?? null,
            })),
        };
    },
    async getInviteData(username) {
        const trainer = await prisma_1.prisma.user.findFirst({
            where: {
                role: "TRAINER",
                username,
            },
            select: {
                id: true,
                name: true,
                avatarUrl: true,
                bio: true,
            },
        });
        if (!trainer) {
            throw { status: 404, message: "Personal não encontrado" };
        }
        return { trainer };
    },
};
