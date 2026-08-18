import { prisma } from "../lib/prisma";
import type { EmailVerificationToken } from "../generated/prisma/client";

export const emailVerificationTokenRepository = {
  async create(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<EmailVerificationToken> {
    return prisma.emailVerificationToken.create({ data });
  },

  async findValidByHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    return prisma.emailVerificationToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  async markUsed(id: string): Promise<void> {
    await prisma.emailVerificationToken.update({ where: { id }, data: { usedAt: new Date() } });
  },

  async deleteAllForUser(userId: string): Promise<void> {
    await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  },
};
