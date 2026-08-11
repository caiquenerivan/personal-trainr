import bcrypt from "bcrypt";
import crypto from "crypto";
import { userRepository } from "../repositories/user.repository";
import { subscriptionRepository } from "../repositories/subscription.repository";
import { prisma } from "../lib/prisma";
import type { PlanTier, Role, SubscriptionStatus } from "../generated/prisma/client";

function generateTempPassword(): string {
  // 12 random bytes -> base64url, trimmed and padded with a digit so it
  // always satisfies the "at least one letter + one number" password rule.
  return crypto.randomBytes(9).toString("base64url") + "9";
}

export const adminService = {
  async listUsers(params: { role?: Role; isActive?: boolean; search?: string; page: number; pageSize: number }) {
    const skip = (params.page - 1) * params.pageSize;
    const [users, total] = await Promise.all([
      userRepository.findMany({ role: params.role, isActive: params.isActive, search: params.search, skip, take: params.pageSize }),
      userRepository.count({ role: params.role, isActive: params.isActive, search: params.search }),
    ]);
    return { users, total, page: params.page, pageSize: params.pageSize };
  },

  async getUser(id: string) {
    const user = await userRepository.findByIdWithRelations(id);
    if (!user) {
      throw { status: 404, message: "Usuário não encontrado" };
    }
    const { passwordHash, ...publicUser } = user;
    return { user: publicUser };
  },

  async updateUser(id: string, data: { name?: string; email?: string; username?: string; phone?: string | null; role?: Role }) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: "Usuário não encontrado" };
    }

    if (data.email && data.email !== existing.email) {
      const other = await userRepository.findByEmail(data.email);
      if (other) throw { status: 400, message: "Email já está em uso" };
    }
    if (data.username && data.username !== existing.username) {
      const other = await userRepository.findByUsername(data.username);
      if (other) throw { status: 400, message: "Nome de usuário já está em uso" };
    }

    const user = await userRepository.updateAdmin(id, data);

    if (data.role === "TRAINER" && existing.role !== "TRAINER") {
      const subscription = await subscriptionRepository.findByUserId(id);
      if (!subscription) await subscriptionRepository.createDefault(id);
    }

    return { user };
  },

  async setActive(id: string, isActive: boolean) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: "Usuário não encontrado" };
    }
    const user = await userRepository.updateAdmin(id, { isActive });
    return { user };
  },

  async resetPassword(id: string) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: "Usuário não encontrado" };
    }
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    await userRepository.updatePasswordHash(id, passwordHash);
    return { tempPassword };
  },

  async deleteUser(id: string) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: "Usuário não encontrado" };
    }
    await userRepository.delete(id);
    return { message: "Usuário excluído" };
  },

  async listSubscriptions() {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true, username: true } } },
    });
    return { subscriptions };
  },

  async updateSubscription(userId: string, data: { plan?: PlanTier; status?: SubscriptionStatus }) {
    let subscription = await subscriptionRepository.findByUserId(userId);
    if (!subscription) {
      const user = await userRepository.findById(userId);
      if (!user) throw { status: 404, message: "Usuário não encontrado" };
      if (user.role !== "TRAINER") throw { status: 400, message: "Apenas treinadores possuem assinatura" };
      subscription = await subscriptionRepository.createDefault(userId);
    }
    const updated = await subscriptionRepository.updateByUserId(userId, data);
    return { subscription: updated };
  },

  async overview() {
    const [totalUsers, totalTrainers, totalStudents, activeUsers, inactiveUsers, byPlan, bySubStatus] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "TRAINER" } }),
      prisma.user.count({ where: { role: "ALUNO" } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.subscription.groupBy({ by: ["plan"], _count: { _all: true } }),
      prisma.subscription.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    return {
      users: {
        total: totalUsers,
        trainers: totalTrainers,
        students: totalStudents,
        active: activeUsers,
        inactive: inactiveUsers,
      },
      plans: byPlan.map((p) => ({ plan: p.plan, count: p._count._all })),
      subscriptionStatus: bySubStatus.map((s) => ({ status: s.status, count: s._count._all })),
    };
  },
};
