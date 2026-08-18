import { prisma } from "../lib/prisma";
import type { OAuthAccount, OAuthProvider } from "../generated/prisma/client";

export const oauthAccountRepository = {
  async findByProviderAndProviderUserId(
    provider: OAuthProvider,
    providerUserId: string,
  ): Promise<OAuthAccount | null> {
    return prisma.oAuthAccount.findUnique({
      where: { provider_providerUserId: { provider, providerUserId } },
    });
  },

  async create(data: {
    userId: string;
    provider: OAuthProvider;
    providerUserId: string;
    email?: string | null;
  }): Promise<OAuthAccount> {
    return prisma.oAuthAccount.create({ data });
  },
};
