import { prisma } from "../lib/prisma";

export const connectionService = {
  async getMyTrainers(studentId: string) {
    const connections = await prisma.trainerStudentConnection.findMany({
      where: {
        studentId,
        status: "ACTIVE",
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            phone: true,
            instagram: true,
            bio: true,
            trainerProfile: {
              select: {
                cref: true,
                crefState: true,
                website: true,
                specialties: true,
              },
            },
          },
        },
      },
    });

    return {
      trainers: connections.map((c) => ({
        connectionId: c.id,
        id: c.trainer.id,
        name: c.trainer.name,
        username: c.trainer.username,
        avatarUrl: c.trainer.avatarUrl,
        phone: c.trainer.phone,
        instagram: c.trainer.instagram,
        bio: c.trainer.bio,
        cref: c.trainer.trainerProfile?.cref ?? null,
        crefState: c.trainer.trainerProfile?.crefState ?? null,
        website: c.trainer.trainerProfile?.website ?? null,
        especialidades: c.trainer.trainerProfile?.specialties ?? null,
      })),
    };
  },

  async getMyStudents(trainerId: string) {
    const connections = await prisma.trainerStudentConnection.findMany({
      where: {
        trainerId,
        status: "ACTIVE",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            weight: true,
            height: true,
            birthDate: true,
            bio: true,
          },
        },
      },
    });

    const studentsWithStatus = await Promise.all(
      connections.map(async (c) => {
        const assignment = await prisma.routineAssignment.findFirst({
          where: {
            alunoId: c.studentId,
            isActive: true,
            expiresAt: { gt: new Date() },
          },
          include: {
            routine: { select: { name: true } },
          },
          orderBy: { assignedAt: "desc" },
        });

        return {
          id: c.student.id,
          name: c.student.name,
          email: c.student.email,
          avatarUrl: c.student.avatarUrl,
          weight: c.student.weight,
          height: c.student.height,
          birthDate: c.student.birthDate,
          bio: c.student.bio,
          hasActiveRoutine: !!assignment,
          routineName: assignment?.routine.name ?? null,
          expiresAt: assignment?.expiresAt?.toISOString() ?? null,
        };
      }),
    );

    return { students: studentsWithStatus };
  },

  async remove(connectionId: string, studentId: string) {
    const connection = await prisma.trainerStudentConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw { status: 404, message: "Conexão não encontrada" };
    }

    if (connection.studentId !== studentId) {
      throw { status: 403, message: "Você não pode remover essa conexão" };
    }

    await prisma.trainerStudentConnection.delete({
      where: { id: connectionId },
    });

    return { message: "Conexão removida com sucesso" };
  },

  async create(data: { studentId: string; trainerId: string }) {
    const existingConnection = await prisma.trainerStudentConnection.findUnique({
      where: {
        trainerId_studentId: {
          trainerId: data.trainerId,
          studentId: data.studentId,
        },
      },
    });

    if (existingConnection) {
      throw { status: 409, message: "Conexão já existe" };
    }

    const trainer = await prisma.user.findFirst({
      where: {
        id: data.trainerId,
        role: "TRAINER",
      },
      select: {
        id: true,
      },
    });

    if (!trainer) {
      throw { status: 404, message: "Personal não encontrado" };
    }

    const connection = await prisma.trainerStudentConnection.create({
      data: {
        trainerId: data.trainerId,
        studentId: data.studentId,
        status: "ACTIVE",
      },
    });

    return { connection };
  },
};
