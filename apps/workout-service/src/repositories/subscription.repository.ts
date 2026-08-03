import { prisma } from "../lib/prisma";

export const subscriptionRepository = {
  async findByUserId(userId: string) {
    return prisma.subscription.findUnique({ where: { userId } });
  },
};
