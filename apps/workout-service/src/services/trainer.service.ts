import { prisma } from "../lib/prisma";

function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

function getMondayOfWeek(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

function getSundayOfWeek(year: number, week: number): Date {
  const monday = getMondayOfWeek(year, week);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return sunday;
}

function groupLogsByWeek(logs: Array<{ completedAt: Date }>): Map<string, number> {
  const weekCounts = new Map<string, number>();
  for (const log of logs) {
    const { year, week } = getISOWeek(new Date(log.completedAt));
    const key = `${year}-W${String(week).padStart(2, "0")}`;
    weekCounts.set(key, (weekCounts.get(key) || 0) + 1);
  }
  return weekCounts;
}

function calculateWeeklyStreak(weekCounts: Map<string, number>, weeklyGoal: number): number {
  const now = new Date();
  const currentWeek = getISOWeek(now);

  let streak = 0;

  const currentKey = `${currentWeek.year}-W${String(currentWeek.week).padStart(2, "0")}`;
  const currentWeekCount = weekCounts.get(currentKey) || 0;
  if (currentWeekCount >= weeklyGoal) {
    streak = 1;
  }

  let checkYear = currentWeek.year;
  let checkWeek = currentWeek.week - 1;

  if (checkWeek < 1) {
    checkYear -= 1;
    const dec31 = new Date(Date.UTC(checkYear, 11, 31));
    const dec31Week = getISOWeek(dec31);
    checkWeek = dec31Week.week;
  }

  while (true) {
    const key = `${checkYear}-W${String(checkWeek).padStart(2, "0")}`;
    const count = weekCounts.get(key) || 0;

    if (count >= weeklyGoal) {
      streak++;
      checkWeek--;
      if (checkWeek < 1) {
        checkYear -= 1;
        const dec31 = new Date(Date.UTC(checkYear, 11, 31));
        const dec31Week = getISOWeek(dec31);
        checkWeek = dec31Week.week;
      }
    } else {
      break;
    }
  }

  return streak;
}

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

    // Step 5: Recent activity feed (last 5 workout logs)
    const recentLogs = await prisma.workoutLog.findMany({
      where: { alunoId: { in: studentIds } },
      orderBy: { completedAt: "desc" },
      take: 5,
      include: {
        routineExercise: {
          include: {
            routine: { select: { id: true, name: true } },
            exercise: { select: { name: true } },
          },
        },
      },
    });

    // Fetch student data for the logs
    const logStudentIds = [...new Set(recentLogs.map((l) => l.alunoId))];
    const logStudents = await prisma.user.findMany({
      where: { id: { in: logStudentIds } },
      select: { id: true, username: true, avatarUrl: true },
    });
    const studentMap = new Map(logStudents.map((s) => [s.id, s]));

    const recentActivity = recentLogs.map((log) => {
      const student = studentMap.get(log.alunoId);
      const re = log.routineExercise;
      const routine = re?.routine;
      const workoutLetter = re?.day ?? null;
      const exerciseName = re?.exercise?.name ?? null;
      return {
        id: log.id,
        studentUsername: student?.username ?? "aluno",
        studentAvatar: student?.avatarUrl ?? null,
        routineName: routine?.name ?? null,
        workoutLetter,
        exerciseName,
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

  async getStudentsProgress(trainerId: string) {
    const connections = await prisma.trainerStudentConnection.findMany({
      where: { trainerId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (connections.length === 0) {
      return { students: [] };
    }

    const studentIds = connections.map((c) => c.studentId);

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeAssignments, workoutLogsLast7Days, workoutLogsMonth] =
      await Promise.all([
        prisma.routineAssignment.findMany({
          where: { alunoId: { in: studentIds }, isActive: true },
          select: { alunoId: true, weeklyGoal: true },
        }),
        prisma.workoutLog.findMany({
          where: {
            alunoId: { in: studentIds },
            completedAt: { gte: sevenDaysAgo },
          },
          select: { alunoId: true, completedAt: true },
        }),
        prisma.workoutLog.findMany({
          where: {
            alunoId: { in: studentIds },
            completedAt: { gte: startOfMonth },
          },
          select: { alunoId: true, completedAt: true },
        }),
      ]);

    const assignmentMap = new Map(
      activeAssignments.map((a) => [a.alunoId, a.weeklyGoal]),
    );

    const logsLast7ByStudent = new Map<string, number>();
    for (const log of workoutLogsLast7Days) {
      logsLast7ByStudent.set(
        log.alunoId,
        (logsLast7ByStudent.get(log.alunoId) || 0) + 1,
      );
    }

    const logsMonthByStudent = new Map<string, number>();
    for (const log of workoutLogsMonth) {
      logsMonthByStudent.set(
        log.alunoId,
        (logsMonthByStudent.get(log.alunoId) || 0) + 1,
      );
    }

    const weekCountsByStudent = new Map<string, Map<string, number>>();
    for (const log of workoutLogsMonth) {
      if (!weekCountsByStudent.has(log.alunoId)) {
        weekCountsByStudent.set(log.alunoId, new Map());
      }
      const wc = weekCountsByStudent.get(log.alunoId)!;
      const { year, week } = getISOWeek(new Date(log.completedAt));
      const key = `${year}-W${String(week).padStart(2, "0")}`;
      wc.set(key, (wc.get(key) || 0) + 1);
    }

    const studentsProgress = connections.map((connection) => {
      const studentId = connection.studentId;
      const weeklyGoal = assignmentMap.get(studentId) ?? 3;
      const workoutsLast7Days = logsLast7ByStudent.get(studentId) || 0;
      const totalWorkoutsMonth = logsMonthByStudent.get(studentId) || 0;
      const wc = weekCountsByStudent.get(studentId) || new Map();
      const weeklyStreak = calculateWeeklyStreak(wc, weeklyGoal);

      const monthlyTarget = weeklyGoal * 4;
      const adhesionRate =
        monthlyTarget > 0
          ? Math.min(100, Math.round((totalWorkoutsMonth / monthlyTarget) * 100))
          : 0;

      return {
        id: connection.student.id,
        name: connection.student.name,
        username: connection.student.username,
        avatarUrl: connection.student.avatarUrl,
        connectionStatus: connection.status,
        weeklyGoal,
        workoutsLast7Days,
        weeklyStreak,
        adhesionRate,
      };
    });

    studentsProgress.sort((a, b) => a.adhesionRate - b.adhesionRate);

    return { students: studentsProgress };
  },
};
