import { routineAssignmentRepository } from "../repositories/routine-assignment.repository";
import { workoutLogRepository } from "../repositories/workout-log.repository";

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

export const dashboardService = {
  async getStudentDashboard(alunoId: string) {
    const assignment = await routineAssignmentRepository.findActiveByAlunoId(alunoId);
    if (!assignment) {
      return { weeklyStreak: 0, assignment: null };
    }

    const logs = await workoutLogRepository.findByAlunoId(alunoId);

    const routineExerciseIds = new Set(
      assignment.routine.exercises.map((re) => re.id),
    );
    const relevantLogs = logs.filter((log) =>
      routineExerciseIds.has(log.routineExerciseId),
    );

    const weekCounts = groupLogsByWeek(relevantLogs);
    const weeklyGoal = assignment.weeklyGoal;

    const now = new Date();
    const currentWeek = getISOWeek(now);

    let streak = 0;

    // Check current week first: if goal already met, count it
    const currentKey = `${currentWeek.year}-W${String(currentWeek.week).padStart(2, "0")}`;
    const currentWeekCount = weekCounts.get(currentKey) || 0;
    const currentWeekGoalMet = currentWeekCount >= weeklyGoal;

    if (currentWeekGoalMet) {
      streak = 1;
    }

    // Walk backwards from last week
    let checkYear = currentWeek.year;
    let checkWeek = currentWeek.week - 1;

    // Handle week overflow (week 1 -> week 52/53 of previous year)
    if (checkWeek < 1) {
      checkYear -= 1;
      checkWeek = 52; // conservative; ISO weeks are 1-52(53)
      // Quick fix: get the actual last week of previous year
      const dec31 = new Date(Date.UTC(checkYear, 11, 31));
      const dec31Week = getISOWeek(dec31);
      checkWeek = dec31Week.week;
    }

    while (true) {
      const key = `${checkYear}-W${String(checkWeek).padStart(2, "0")}`;
      const count = weekCounts.get(key) || 0;

      if (count >= weeklyGoal) {
        streak++;
        // Move to previous week
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

    return {
      weeklyStreak: streak,
      assignment: {
        id: assignment.id,
        routineId: assignment.routineId,
        weeklyGoal: assignment.weeklyGoal,
        expiresAt: assignment.expiresAt,
        assignedAt: assignment.assignedAt,
      },
    };
  },
};
