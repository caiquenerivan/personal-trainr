import { prisma } from "../lib/prisma";
import type { User } from "../generated/prisma/client";

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: "TRAINER" | "ALUNO";
  avatarUrl?: string | null;
  phone?: string | null;
  birthDate?: Date | null;
}

export type PublicUser = Omit<User, "passwordHash">;

function toPublic(user: User): PublicUser {
  const { passwordHash, ...publicUser } = user;
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

  async findById(id: string): Promise<PublicUser | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? toPublic(user) : null;
  },

  async update(id: string, data: Partial<Pick<User, "name" | "avatarUrl" | "phone" | "weight" | "height" | "birthDate">>): Promise<PublicUser | null> {
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
};
