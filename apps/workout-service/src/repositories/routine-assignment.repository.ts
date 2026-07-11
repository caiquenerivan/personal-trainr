import { prisma } from "../lib/prisma";
import type { RoutineAssignment } from "../generated/prisma/client";

export interface CreateAssignmentData {
  routineId: string;
  alunoId: string;
  weeklyGoal: number;
  expiresAt: Date;
}

export const routineAssignmentRepository = {
  async create(data: CreateAssignmentData): Promise<RoutineAssignment> {
    return prisma.routineAssignment.create({ data });
  },

  async findActiveByAlunoId(alunoId: string) {
    return prisma.routineAssignment.findFirst({
      where: {
        alunoId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { assignedAt: "desc" },
      include: {
        routine: {
          include: {
            exercises: {
              include: { exercise: true },
            },
          },
        },
      },
    });
  },

  async deactivateExpired(): Promise<void> {
    await prisma.routineAssignment.updateMany({
      where: {
        isActive: true,
        expiresAt: { lte: new Date() },
      },
      data: { isActive: false },
    });
  },
};
