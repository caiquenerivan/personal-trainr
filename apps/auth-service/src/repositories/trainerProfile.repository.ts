import { prisma } from "../lib/prisma";
import type { TrainerProfile, UF } from "../generated/prisma/client";

export interface TrainerProfileData {
  cref: string;
  crefState: UF;
  crefCity: string;
  experienceYears?: number | null;
  specialties?: string | null;
  website?: string | null;
}

export const trainerProfileRepository = {
  async findByUserId(userId: string): Promise<TrainerProfile | null> {
    return prisma.trainerProfile.findUnique({ where: { userId } });
  },

  async findByCref(cref: string): Promise<TrainerProfile | null> {
    return prisma.trainerProfile.findUnique({ where: { cref } });
  },

  async upsert(userId: string, data: TrainerProfileData): Promise<TrainerProfile> {
    return prisma.trainerProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },
};
