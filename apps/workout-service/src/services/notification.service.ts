import { prisma } from "../lib/prisma";
import { sendPush } from "../lib/push";

// janela de uma "sessão" de treino: logs do mesmo aluno dentro dela contam
// como o mesmo treino (o web registra exercício por exercício)
const SESSION_WINDOW_MS = 2 * 60 * 60 * 1000;
// treino sincronizado muito depois de feito não vira notificação
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

export const notificationService = {
  async registerToken(userId: string, token: string, platform: string) {
    await prisma.pushToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  },

  async removeToken(userId: string, token: string) {
    await prisma.pushToken.deleteMany({ where: { token, userId } });
  },

  // Chamado antes de gravar os logs: só o primeiro registro de uma sessão
  // avisa o personal (sem isso o web mandaria uma notificação por exercício).
  async isNewSession(alunoId: string, firstCompletedAt: Date): Promise<boolean> {
    if (Date.now() - firstCompletedAt.getTime() > STALE_AFTER_MS) return false;
    const previous = await prisma.workoutLog.findFirst({
      where: {
        alunoId,
        completedAt: { gte: new Date(firstCompletedAt.getTime() - SESSION_WINDOW_MS), lte: firstCompletedAt },
      },
      select: { id: true },
    });
    return !previous;
  },

  async notifyWorkoutCompleted(alunoId: string, routineExerciseIds: string[]) {
    if (routineExerciseIds.length === 0) return;
    const routineExercises = await prisma.routineExercise.findMany({
      where: { id: { in: routineExerciseIds } },
      select: { day: true, routine: { select: { name: true, trainerId: true } } },
    });
    const first = routineExercises.find((re) => re.routine.trainerId !== alunoId);
    if (!first) return; // treino do próprio personal (Meu Treino)

    const student = await prisma.user.findUnique({ where: { id: alunoId }, select: { name: true } });
    await sendPush([first.routine.trainerId], {
      title: `${student?.name.split(" ")[0] ?? "Seu aluno"} concluiu um treino`,
      body: `Treino ${first.day} · ${first.routine.name}`,
      data: { url: "/progresso" },
    });
  },

  async notifyRoutineAssigned(alunoId: string, trainerId: string, routineName: string) {
    if (alunoId === trainerId) return;
    const trainer = await prisma.user.findUnique({ where: { id: trainerId }, select: { name: true } });
    await sendPush([alunoId], {
      title: "Nova rotina de treino",
      body: `${trainer?.name.split(" ")[0] ?? "Seu personal"} vinculou a rotina ${routineName} para você.`,
      data: { url: "/" },
    });
  },
};
