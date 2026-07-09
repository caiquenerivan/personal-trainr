"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exerciseRepository = void 0;
const prisma_1 = require("../lib/prisma");
exports.exerciseRepository = {
    async create(data) {
        return prisma_1.prisma.exercise.create({ data });
    },
    async findById(id) {
        return prisma_1.prisma.exercise.findUnique({ where: { id } });
    },
    async findManyByIds(ids) {
        return prisma_1.prisma.exercise.findMany({ where: { id: { in: ids } } });
    },
    async list() {
        return prisma_1.prisma.exercise.findMany({ orderBy: { name: "asc" } });
    },
};
