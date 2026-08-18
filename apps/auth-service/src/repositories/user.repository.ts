import { prisma } from "../lib/prisma";
import type { Prisma, Role, User } from "../generated/prisma/client";

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: "TRAINER" | "ALUNO";
  username: string;
  avatarUrl?: string | null;
  phone?: string | null;
  birthDate?: Date | null;
}

export type PublicUser = Omit<User, "passwordHash" | "twoFactorSecret" | "twoFactorBackupCodes">;

function toPublic(user: User): PublicUser {
  const { passwordHash, twoFactorSecret, twoFactorBackupCodes, ...publicUser } = user;
  return publicUser;
}

export const userRepository = {
  async create(data: CreateUserData): Promise<PublicUser> {
    const user = await prisma.user.create({ data });
    return toPublic(user);
  },

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  },

  async findById(id: string): Promise<PublicUser | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? toPublic(user) : null;
  },

  async update(id: string, data: Partial<Pick<User, "name" | "avatarUrl" | "phone" | "weight" | "height" | "birthDate" | "username" | "bio" | "instagram">>): Promise<PublicUser | null> {
    const user = await prisma.user.update({ where: { id }, data });
    return toPublic(user);
  },

  async findByIdWithHash(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async updatePasswordHash(id: string, passwordHash: string): Promise<PublicUser | null> {
    const user = await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
    return toPublic(user);
  },

  async updateEmailVerified(id: string, emailVerified: boolean): Promise<PublicUser | null> {
    const user = await prisma.user.update({
      where: { id },
      data: { emailVerified },
    });
    return toPublic(user);
  },

  async setTwoFactorSecret(id: string, twoFactorSecret: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { twoFactorSecret } });
  },

  async enableTwoFactor(id: string, twoFactorBackupCodes: string[]): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { twoFactorEnabled: true, twoFactorBackupCodes },
    });
  },

  async disableTwoFactor(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: [] },
    });
  },

  async updateTwoFactorBackupCodes(id: string, twoFactorBackupCodes: string[]): Promise<void> {
    await prisma.user.update({ where: { id }, data: { twoFactorBackupCodes } });
  },

  async findMany(params: {
    role?: Role;
    isActive?: boolean;
    search?: string;
    skip: number;
    take: number;
  }): Promise<PublicUser[]> {
    const where = buildAdminWhere(params);
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
      include: { trainerProfile: true, subscription: true },
    });
    return users.map(toPublic) as PublicUser[];
  },

  async count(params: { role?: Role; isActive?: boolean; search?: string }): Promise<number> {
    return prisma.user.count({ where: buildAdminWhere(params) });
  },

  async findByIdWithRelations(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { trainerProfile: true, subscription: true },
    });
  },

  async updateAdmin(
    id: string,
    data: Partial<Pick<User, "name" | "email" | "username" | "phone" | "role" | "isActive">>,
  ): Promise<PublicUser> {
    const user = await prisma.user.update({ where: { id }, data });
    return toPublic(user);
  },

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  },
};

function buildAdminWhere(params: { role?: Role; isActive?: boolean; search?: string }): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  if (params.role) where.role = params.role;
  if (params.isActive !== undefined) where.isActive = params.isActive;
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { username: { contains: params.search, mode: "insensitive" } },
    ];
  }
  return where;
}
