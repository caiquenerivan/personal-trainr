import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { userRepository } from "../repositories/user.repository";
import { subscriptionRepository } from "../repositories/subscription.repository";
import { asaasProvider } from "../providers/AsaasProvider";
import { deleteFromCloudinary } from "./upload.service";

export const DELETE_CONFIRMATION = "EXCLUIR";

// Exclusão da própria conta (exigida pela Google Play e pela App Store, e
// direito do titular na LGPD): apaga a conta e todos os dados ligados a ela.
export const accountService = {
  async deleteOwnAccount(userId: string, params: { confirmation: string; password?: string }) {
    if (params.confirmation.trim().toUpperCase() !== DELETE_CONFIRMATION) {
      throw { status: 400, message: `Digite ${DELETE_CONFIRMATION} para confirmar a exclusão.` };
    }

    const user = await userRepository.findByIdWithHash(userId);
    if (!user) {
      throw { status: 404, message: "Conta não encontrada" };
    }
    if (user.role === "ADMIN") {
      throw { status: 403, message: "Contas de administrador não podem ser excluídas por aqui." };
    }
    // Conta só com login social não tem senha: a confirmação digitada basta.
    if (user.passwordHash) {
      if (!params.password || !(await bcrypt.compare(params.password, user.passwordHash))) {
        throw { status: 401, message: "Senha incorreta" };
      }
    }

    // Cancela a cobrança antes de apagar: se o Asaas falhar, a conta fica
    // (melhor do que apagar e continuar cobrando).
    const subscription = await subscriptionRepository.findByUserId(userId);
    if (subscription?.asaasSubscriptionId && subscription.status !== "CANCELED") {
      try {
        await asaasProvider.cancelSubscription(subscription.asaasSubscriptionId);
      } catch (err) {
        logger.error({ err, userId }, "Failed to cancel Asaas subscription on account deletion");
        throw {
          status: 502,
          message: "Não foi possível cancelar sua assinatura agora. Tente novamente em alguns minutos.",
        };
      }
    }

    // As tabelas do workout-service guardam o id do usuário sem chave
    // estrangeira (o User delas é só leitura), então são apagadas aqui, na
    // mesma transação. Rotinas levam junto exercícios e atribuições (cascade);
    // logs de outros alunos que usavam um exercício próprio dele ficam, sem o
    // exercício (SET NULL).
    await prisma.$transaction([
      prisma.$executeRaw`DELETE FROM "WorkoutLog" WHERE "alunoId" = ${userId}`,
      prisma.$executeRaw`DELETE FROM "RoutineAssignment" WHERE "alunoId" = ${userId}`,
      prisma.$executeRaw`DELETE FROM "Routine" WHERE "trainerId" = ${userId}`,
      prisma.$executeRaw`DELETE FROM "Exercise" WHERE "trainerId" = ${userId}`,
      prisma.$executeRaw`DELETE FROM "TrainerRating" WHERE "trainerId" = ${userId} OR "studentId" = ${userId}`,
      // tokens, assinatura, perfil de personal e vínculos saem em cascata
      prisma.user.delete({ where: { id: userId } }),
    ]);

    if (user.avatarUrl) {
      deleteFromCloudinary(user.avatarUrl).catch((err) =>
        logger.warn({ err, userId }, "Failed to delete avatar from Cloudinary"),
      );
    }

    logger.info({ userId, role: user.role }, "Account deleted by its owner");
    return { message: "Conta excluída" };
  },
};
