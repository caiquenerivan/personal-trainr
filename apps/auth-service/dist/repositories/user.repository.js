"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const prisma_1 = require("../lib/prisma");
function toPublic(user) {
    const { passwordHash, ...publicUser } = user;
    return publicUser;
}
exports.userRepository = {
    async create(data) {
        const user = await prisma_1.prisma.user.create({ data });
        return toPublic(user);
    },
    async findByEmail(email) {
        return prisma_1.prisma.user.findUnique({ where: { email } });
    },
    async findById(id) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        return user ? toPublic(user) : null;
    },
    async update(id, data) {
        const user = await prisma_1.prisma.user.update({ where: { id }, data });
        return toPublic(user);
    },
};
