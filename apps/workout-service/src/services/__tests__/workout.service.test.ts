import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    routineExercise: { findUnique: vi.fn() },
    routineAssignment: { findFirst: vi.fn() },
    trainerStudentConnection: { findUnique: vi.fn() },
  },
}));
vi.mock("../../repositories/workout-log.repository", () => ({
  workoutLogRepository: {
    create: vi.fn(),
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
