import { prisma } from "../lib/prisma";
import type { RoutineAssignment } from "../generated/prisma/client";
import { routineRepository } from "./routine.repository";

export interface CreateAssignmentData {
  routineId: string;
  alunoId: string;
  expiresAt: Date;
}

export interface AssignmentWithRoutine extends RoutineAssignment {
  routine: Awaited<ReturnType<typeof routineRepository.findById>>;
}

export const routineAssignmentRepository = {
  async create(data: CreateAssignmentData): Promise<RoutineAssignment> {
    return prisma.routineAssignment.create({ data });
  },

  async findActiveByAlunoId(alunoId: string): Promise<AssignmentWithRoutine | null> {
    const assignment = await prisma.routineAssignment.findFirst({
      where: {
        alunoId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { assignedAt: "desc" },
    });

    if (!assignment) return null;

    const routine = await routineRepository.findById(assignment.routineId);
    return { ...assignment, routine };
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
