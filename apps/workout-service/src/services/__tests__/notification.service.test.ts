import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    workoutLog: { findFirst: vi.fn() },
    routineExercise: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
    pushToken: { findMany: vi.fn(), deleteMany: vi.fn() },
  },
}));

import { notificationService } from "../notification.service";
import { prisma } from "../../lib/prisma";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("notificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.pushToken.findMany).mockResolvedValue([{ token: "ExponentPushToken[a]" }, { token: "ExponentPushToken[b]" }] as any);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ status: "ok" }, { status: "error", details: { error: "DeviceNotRegistered" } }] }),
    });
  });

  it("sessão nova quando não há log do aluno nas 2 horas anteriores", async () => {
    vi.mocked(prisma.workoutLog.findFirst).mockResolvedValue(null);
    expect(await notificationService.isNewSession("a-1", new Date())).toBe(true);
    vi.mocked(prisma.workoutLog.findFirst).mockResolvedValue({ id: "l-1" } as any);
    expect(await notificationService.isNewSession("a-1", new Date())).toBe(false);
  });

  it("treino sincronizado muito tempo depois não notifica", async () => {
    expect(await notificationService.isNewSession("a-1", new Date(Date.now() - 13 * 3600 * 1000))).toBe(false);
    expect(prisma.workoutLog.findFirst).not.toHaveBeenCalled();
  });

  it("avisa o personal da rotina e limpa token de app desinstalado", async () => {
    vi.mocked(prisma.routineExercise.findMany).mockResolvedValue([{ day: "A", routine: { name: "Hipertrofia", trainerId: "t-1" } }] as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: "Maria Souza" } as any);

    await notificationService.notifyWorkoutCompleted("a-1", ["re-1"]);

    expect(prisma.pushToken.findMany).toHaveBeenCalledWith({ where: { userId: { in: ["t-1"] } }, select: { token: true } });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body[0]).toMatchObject({ title: "Maria concluiu um treino", body: "Treino A · Hipertrofia", data: { url: "/progresso" } });
    expect(prisma.pushToken.deleteMany).toHaveBeenCalledWith({ where: { token: { in: ["ExponentPushToken[b]"] } } });
  });

  it("não notifica o treino do próprio personal (Meu Treino)", async () => {
    vi.mocked(prisma.routineExercise.findMany).mockResolvedValue([{ day: "A", routine: { name: "R", trainerId: "a-1" } }] as any);
    await notificationService.notifyWorkoutCompleted("a-1", ["re-1"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rotina vinculada a si mesmo não notifica; para o aluno, notifica", async () => {
    await notificationService.notifyRoutineAssigned("t-1", "t-1", "R");
    expect(fetchMock).not.toHaveBeenCalled();

    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: "Carlos Lima" } as any);
    await notificationService.notifyRoutineAssigned("a-1", "t-1", "Força");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body[0]).toMatchObject({ title: "Nova rotina de treino", body: "Carlos vinculou a rotina Força para você." });
  });

  it("falha no envio não propaga erro", async () => {
    vi.mocked(prisma.routineExercise.findMany).mockResolvedValue([{ day: "A", routine: { name: "R", trainerId: "t-1" } }] as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: "Ana" } as any);
    fetchMock.mockRejectedValue(new Error("offline"));
    await expect(notificationService.notifyWorkoutCompleted("a-1", ["re-1"])).resolves.toBeUndefined();
  });
});
