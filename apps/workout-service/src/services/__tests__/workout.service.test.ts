import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    routineExercise: { findUnique: vi.fn(), findMany: vi.fn() },
    routineAssignment: { findFirst: vi.fn(), findMany: vi.fn() },
    exercise: { findMany: vi.fn() },
    trainerStudentConnection: { findUnique: vi.fn() },
  },
}));
vi.mock("../../repositories/workout-log.repository", () => ({
  workoutLogRepository: {
    create: vi.fn(),
    findClientIds: vi.fn(),
    createManyFromClient: vi.fn(),
    findByAlunoId: vi.fn(),
    findForProgress: vi.fn(),
  },
}));

import { workoutService } from "../workout.service";
import { prisma } from "../../lib/prisma";
import { workoutLogRepository } from "../../repositories/workout-log.repository";

const d = (s: string) => new Date(`${s}T10:00:00Z`);

describe("workoutService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("guarda o exercício junto com a carga ao concluir", async () => {
    vi.mocked(prisma.routineExercise.findUnique).mockResolvedValue({ id: "re-1", routineId: "r-1", exerciseId: "ex-1" } as any);
    vi.mocked(prisma.routineAssignment.findFirst).mockResolvedValue({ id: "a-1" } as any);
    vi.mocked(workoutLogRepository.create).mockResolvedValue({ id: "log-1" } as any);

    await workoutService.completeWorkout("aluno-1", "re-1", 40);

    expect(workoutLogRepository.create).toHaveBeenCalledWith({
      alunoId: "aluno-1",
      routineExerciseId: "re-1",
      exerciseId: "ex-1",
      weightUsed: 40,
    });
  });

  it("resume a evolução por exercício (primeira, última, maior carga)", async () => {
    vi.mocked(workoutLogRepository.findForProgress).mockResolvedValue([
      { exerciseId: "ex-1", weightUsed: 20, completedAt: d("2026-09-01"), exercise: { name: "Supino", muscle: "Peito" } },
      { exerciseId: "ex-2", weightUsed: null, completedAt: d("2026-09-02"), exercise: { name: "Prancha", muscle: "Core" } },
      { exerciseId: "ex-1", weightUsed: 30, completedAt: d("2026-09-15"), exercise: { name: "Supino", muscle: "Peito" } },
      { exerciseId: "ex-1", weightUsed: 27.5, completedAt: d("2026-10-01"), exercise: { name: "Supino", muscle: "Peito" } },
    ] as any);

    const { exercises } = await workoutService.getProgressSummary("aluno-1");

    expect(exercises.map((e) => e.exerciseId)).toEqual(["ex-1", "ex-2"]);
    expect(exercises[0]).toMatchObject({
      sessions: 3,
      first: { weight: 20, date: d("2026-09-01") },
      last: { weight: 27.5, date: d("2026-10-01") },
      maxWeight: 30,
    });
    expect(exercises[1]).toMatchObject({ sessions: 1, first: null, last: null, maxWeight: null });
  });

  it("bloqueia o personal sem vínculo ativo com o aluno", async () => {
    vi.mocked(prisma.trainerStudentConnection.findUnique).mockResolvedValue({ status: "PENDING" } as any);
    await expect(workoutService.assertTrainerOfStudent("t-1", "a-1")).rejects.toMatchObject({ status: 403 });
  });
});

describe("workoutService.syncWorkoutLogs", () => {
  const recent = () => new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const item = (over: Partial<Record<string, any>> = {}) => ({
    clientId: "c-1",
    routineExerciseId: "re-1",
    exerciseId: "ex-1",
    weightUsed: 40,
    completedAt: recent(),
    ...over,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(workoutLogRepository.findClientIds).mockResolvedValue([]);
    vi.mocked(prisma.routineExercise.findMany).mockResolvedValue([
      { id: "re-1", routineId: "r-1", exerciseId: "ex-1" },
    ] as any);
    vi.mocked(prisma.exercise.findMany).mockResolvedValue([{ id: "ex-1" }, { id: "ex-2" }] as any);
    vi.mocked(prisma.routineAssignment.findMany).mockResolvedValue([{ routineId: "r-1" }] as any);
  });

  it("salva com a data do aparelho, não a do envio", async () => {
    const completedAt = recent();
    const { results } = await workoutService.syncWorkoutLogs("aluno-1", [item({ completedAt })]);

    expect(results).toEqual([{ clientId: "c-1", status: "saved" }]);
    const saved = vi.mocked(workoutLogRepository.createManyFromClient).mock.calls[0][0];
    expect(saved[0]).toMatchObject({ alunoId: "aluno-1", clientId: "c-1", routineExerciseId: "re-1", exerciseId: "ex-1", weightUsed: 40 });
    expect(saved[0].completedAt.toISOString()).toBe(completedAt);
  });

  it("não duplica um clientId já sincronizado nem repetido no mesmo lote", async () => {
    vi.mocked(workoutLogRepository.findClientIds).mockResolvedValue(["c-1"]);

    const { results } = await workoutService.syncWorkoutLogs("aluno-1", [item(), item({ clientId: "c-2" }), item({ clientId: "c-2" })]);

    expect(results.map((r) => r.status)).toEqual(["duplicate", "saved", "duplicate"]);
    expect(vi.mocked(workoutLogRepository.createManyFromClient).mock.calls[0][0]).toHaveLength(1);
  });

  it("guarda só o exercício quando a rotina foi editada enquanto estava offline", async () => {
    const { results } = await workoutService.syncWorkoutLogs("aluno-1", [
      item({ routineExerciseId: "re-apagado", exerciseId: "ex-2" }),
    ]);

    expect(results[0].status).toBe("saved");
    expect(vi.mocked(workoutLogRepository.createManyFromClient).mock.calls[0][0][0]).toMatchObject({
      routineExerciseId: null,
      exerciseId: "ex-2",
    });
  });

  it("rejeita exercício de rotina que nunca foi atribuída ao usuário", async () => {
    vi.mocked(prisma.routineAssignment.findMany).mockResolvedValue([]);

    const { results } = await workoutService.syncWorkoutLogs("aluno-1", [item()]);

    expect(results[0]).toMatchObject({ status: "rejected" });
    expect(workoutLogRepository.createManyFromClient).not.toHaveBeenCalled();
  });

  it("rejeita registro antigo demais e limita data no futuro ao relógio do servidor", async () => {
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const { results } = await workoutService.syncWorkoutLogs("aluno-1", [
      item({ completedAt: old }),
      item({ clientId: "c-2", completedAt: future }),
    ]);

    expect(results.map((r) => r.status)).toEqual(["rejected", "saved"]);
    const saved = vi.mocked(workoutLogRepository.createManyFromClient).mock.calls[0][0][0];
    expect(saved.completedAt.getTime()).toBeLessThanOrEqual(Date.now() + 5 * 60 * 1000);
  });
});
