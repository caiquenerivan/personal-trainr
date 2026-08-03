import { prisma } from "../lib/prisma";
import type { Subscription } from "../generated/prisma/client";

export const subscriptionRepository = {
  async findByUserId(userId: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({ where: { userId } });
  },

  async createDefault(userId: string): Promise<Subscription> {
    return prisma.subscription.create({ data: { userId } });
  },

  async findByAsaasSubscriptionId(asaasSubscriptionId: string): Promise<Subscription | null> {
    return prisma.subscription.findFirst({ where: { asaasSubscriptionId } });
  },

  async updateByUserId(
    userId: string,
    data: Partial<
      Pick<Subscription, "plan" | "status" | "asaasCustomerId" | "asaasSubscriptionId" | "currentPeriodEnd">
    >,
  ): Promise<Subscription> {
    return prisma.subscription.update({ where: { userId }, data });
  },
};
