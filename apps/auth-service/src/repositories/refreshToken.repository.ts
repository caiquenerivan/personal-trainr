import { prisma } from "../lib/prisma";
import type { RefreshToken } from "../generated/prisma/client";

export const refreshTokenRepository = {
  async create(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data });
  },

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  // Condicional em revokedAt: null para que dois usos simultâneos do mesmo
  // token não consigam ambos rotacionar — só o primeiro recebe true.
  async revoke(id: string): Promise<boolean> {
    const result = await prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count > 0;
  },

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
