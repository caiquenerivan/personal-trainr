import { prisma } from "../lib/prisma";

export const trainerService = {
  async listAll() {
    const trainers = await prisma.user.findMany({
      where: { role: "TRAINER" },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        bio: true,
        trainerProfile: {
          select: { specialties: true },
        },
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return {
      trainers: trainers.map((trainer) => ({
        id: trainer.id,
        name: trainer.name,
        username: trainer.username,
        avatarUrl: trainer.avatarUrl,
        bio: trainer.bio,
        especialidades: trainer.trainerProfile?.specialties ?? null,
      })),
    };
  },

  async search(q: string) {
    const trainers = await prisma.user.findMany({
      where: {
        role: "TRAINER",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        bio: true,
        trainerProfile: {
          select: {
            specialties: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      take: 20,
    });

    return {
      trainers: trainers.map((trainer) => ({
        id: trainer.id,
        name: trainer.name,
        username: trainer.username,
        avatarUrl: trainer.avatarUrl,
        bio: trainer.bio,
        especialidades: trainer.trainerProfile?.specialties ?? null,
      })),
    };
  },

  async getInviteData(username: string) {
    const trainer = await prisma.user.findFirst({
      where: {
        role: "TRAINER",
        username,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
      },
    });

    if (!trainer) {
      throw { status: 404, message: "Personal não encontrado" };
    }

    return { trainer };
  },

  async getDashboard(trainerId: string) {
    // Step 1: Active student IDs
    const connections = await prisma.trainerStudentConnection.findMany({
      where: { trainerId, status: "ACTIVE" },
      select: { studentId: true },
    });
    const studentIds = connections.map((c) => c.studentId);

    if (studentIds.length === 0) {
      return {
        activeStudentsCount: 0,
        workoutsLast7Days: 0,
        routinesInUseCount: 0,
        adhesionRate: 0,
        activeStudentsList: [],
        mostUsedRoutines: [],
        recentActivity: [],
      };
    }

    // Step 2: Simple metrics (parallel)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeAssignmentsCount, workoutsLast7Days, distinctRoutines] =
      await Promise.all([
        prisma.routineAssignment.count({
          where: { alunoId: { in: studentIds }, isActive: true },
        }),
        prisma.workoutLog.count({
          where: {
            alunoId: { in: studentIds },
            completedAt: { gte: sevenDaysAgo },
          },
        }),
        prisma.routineAssignment.findMany({
          where: { alunoId: { in: studentIds }, isActive: true },
          select: { routineId: true },
          distinct: ["routineId"],
        }),
      ]);

    const routinesInUseCount = distinctRoutines.length;

    // Step 3: Active students list (top 5 with routine info)
    const recentConnections = await prisma.trainerStudentConnection.findMany({
      where: { trainerId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    const studentIdsForAssignments = recentConnections.map(
      (c) => c.studentId,
    );
    const activeAssignments = await prisma.routineAssignment.findMany({
      where: {
        alunoId: { in: studentIdsForAssignments },
        isActive: true,
      },
      include: {
        routine: { select: { name: true } },
      },
    });

    const assignmentByStudent = new Map(
      activeAssignments.map((a) => [a.alunoId, a]),
    );

    const activeStudentsList = recentConnections.map((c) => {
      const assignment = assignmentByStudent.get(c.studentId);
      return {
        id: c.student.id,
        name: c.student.name,
        avatarUrl: c.student.avatarUrl,
        routineName: assignment?.routine.name ?? null,
        connectedAt: c.createdAt.toISOString(),
      };
    });

    // Step 4: Most used routines (top 4)
    const routineCounts = await prisma.routineAssignment.groupBy({
      by: ["routineId"],
      where: { alunoId: { in: studentIds }, isActive: true },
      _count: { routineId: true },
      orderBy: { _count: { routineId: "desc" } },
      take: 4,
    });

    const routineIds = routineCounts.map((r) => r.routineId);
    const routines = await prisma.routine.findMany({
      where: { id: { in: routineIds } },
      select: { id: true, name: true, type: true },
    });

    const routineMap = new Map(routines.map((r) => [r.id, r]));
    const mostUsedRoutines = routineCounts.map((rc) => {
      const routine = routineMap.get(rc.routineId);
      return {
        id: rc.routineId,
        name: routine?.name ?? "Rotina removida",
        type: routine?.type ?? null,
        studentsUsing: rc._count.routineId,
      };
    });

    // Step 5: Recent activity feed (last 8 workout logs)
    const recentLogs = await prisma.workoutLog.findMany({
      where: { alunoId: { in: studentIds } },
      orderBy: { completedAt: "desc" },
      take: 8,
      include: {
        routineExercise: {
          include: {
            routine: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Fetch student data for the logs
    const logStudentIds = [...new Set(recentLogs.map((l) => l.alunoId))];
    const logStudents = await prisma.user.findMany({
      where: { id: { in: logStudentIds } },
      select: { id: true, name: true, avatarUrl: true },
    });
    const studentMap = new Map(logStudents.map((s) => [s.id, s]));

    const recentActivity = recentLogs.map((log) => {
      const student = studentMap.get(log.alunoId);
      const routine = log.routineExercise?.routine;
      return {
        id: log.id,
        studentName: student?.name ?? "Aluno",
        studentAvatar: student?.avatarUrl ?? null,
        routineName: routine?.name ?? null,
        completedAt: log.completedAt.toISOString(),
      };
    });

    // Step 6: Adhesion rate
    const activeAssignmentsWithGoal = await prisma.routineAssignment.findMany({
      where: { alunoId: { in: studentIds }, isActive: true },
      select: { weeklyGoal: true },
    });

    const totalWorkoutsLastMonth = await prisma.workoutLog.count({
      where: {
        alunoId: { in: studentIds },
        completedAt: { gte: thirtyDaysAgo },
      },
    });

    let adhesionRate = 0;
    if (activeAssignmentsWithGoal.length > 0) {
      const avgWeeklyGoal =
        activeAssignmentsWithGoal.reduce((sum, a) => sum + a.weeklyGoal, 0) /
        activeAssignmentsWithGoal.length;
      const monthlyTarget = avgWeeklyGoal * 4;
      adhesionRate = Math.min(
        100,
        Math.round((totalWorkoutsLastMonth / monthlyTarget) * 100),
      );
    }

    return {
      activeStudentsCount: activeAssignmentsCount,
      workoutsLast7Days,
      routinesInUseCount,
      adhesionRate,
      activeStudentsList,
      mostUsedRoutines,
      recentActivity,
    };
  },
};
