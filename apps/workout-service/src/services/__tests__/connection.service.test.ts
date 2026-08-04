import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    trainerStudentConnection: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
    routineAssignment: {
      findFirst: vi.fn(),
    },
  },
}));
vi.mock("../../repositories/rating.repository", () => ({
  ratingRepository: {
    getAggregatesForTrainers: vi.fn().mockResolvedValue(new Map()),
    findByTrainerAndStudent: vi.fn().mockResolvedValue(null),
  },
}));
vi.mock("../../repositories/subscription.repository", () => ({
  subscriptionRepository: {
    findByUserId: vi.fn(),
  },
}));

import { connectionService } from "../connection.service";
import { prisma } from "../../lib/prisma";
import { subscriptionRepository } from "../../repositories/subscription.repository";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("connectionService.create", () => {
  it("rejeita conexão duplicada", async () => {
    vi.mocked(prisma.trainerStudentConnection.findUnique).mockResolvedValue({ id: "conn-1" } as any);

    await expect(
      connectionService.create({ studentId: "student-1", trainerId: "trainer-1" }),
    ).rejects.toMatchObject({ status: 409, message: "Conexão já existe" });
  });

  it("rejeita trainerId que não corresponde a um TRAINER", async () => {
    vi.mocked(prisma.trainerStudentConnection.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    await expect(
      connectionService.create({ studentId: "student-1", trainerId: "trainer-1" }),
    ).rejects.toMatchObject({ status: 404, message: "Personal não encontrado" });
  });

  it("permite conectar quando abaixo do limite do plano Grátis (3 alunos)", async () => {
    vi.mocked(prisma.trainerStudentConnection.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: "trainer-1" } as any);
    vi.mocked(subscriptionRepository.findByUserId).mockResolvedValue(null); // sem assinatura = FREE
    vi.mocked(prisma.trainerStudentConnection.count).mockResolvedValue(2);
    vi.mocked(prisma.trainerStudentConnection.create).mockResolvedValue({ id: "conn-new" } as any);

    const result = await connectionService.create({ studentId: "student-4", trainerId: "trainer-1" });

    expect(result.connection.id).toBe("conn-new");
  });

  it("bloqueia conexão ao atingir o limite do plano Grátis (3 alunos)", async () => {
    vi.mocked(prisma.trainerStudentConnection.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: "trainer-1" } as any);
    vi.mocked(subscriptionRepository.findByUserId).mockResolvedValue(null);
    vi.mocked(prisma.trainerStudentConnection.count).mockResolvedValue(3);

    await expect(
      connectionService.create({ studentId: "student-4", trainerId: "trainer-1" }),
    ).rejects.toMatchObject({ status: 403 });
    expect(prisma.trainerStudentConnection.create).not.toHaveBeenCalled();
  });

  it("usa o limite do plano Pro (20) quando a assinatura está ACTIVE", async () => {
    vi.mocked(prisma.trainerStudentConnection.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: "trainer-1" } as any);
    vi.mocked(subscriptionRepository.findByUserId).mockResolvedValue({
      id: "sub-1",
      userId: "trainer-1",
      plan: "PRO",
      status: "ACTIVE",
      asaasCustomerId: null,
      asaasSubscriptionId: null,
      currentPeriodEnd: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(prisma.trainerStudentConnection.count).mockResolvedValue(10);
    vi.mocked(prisma.trainerStudentConnection.create).mockResolvedValue({ id: "conn-new" } as any);

    const result = await connectionService.create({ studentId: "student-11", trainerId: "trainer-1" });

    expect(result.connection.id).toBe("conn-new");
  });

  it("cai para o limite do plano Grátis se a assinatura Pro estiver inadimplente (PAST_DUE)", async () => {
    vi.mocked(prisma.trainerStudentConnection.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: "trainer-1" } as any);
    vi.mocked(subscriptionRepository.findByUserId).mockResolvedValue({
      id: "sub-1",
      userId: "trainer-1",
      plan: "PRO",
      status: "PAST_DUE",
      asaasCustomerId: "cus_1",
      asaasSubscriptionId: "sub_1",
      currentPeriodEnd: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(prisma.trainerStudentConnection.count).mockResolvedValue(3);

    await expect(
      connectionService.create({ studentId: "student-4", trainerId: "trainer-1" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("não limita conexões no plano Ilimitado", async () => {
    vi.mocked(prisma.trainerStudentConnection.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: "trainer-1" } as any);
    vi.mocked(subscriptionRepository.findByUserId).mockResolvedValue({
      id: "sub-1",
      userId: "trainer-1",
      plan: "UNLIMITED",
      status: "ACTIVE",
      asaasCustomerId: "cus_1",
      asaasSubscriptionId: "sub_1",
      currentPeriodEnd: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(prisma.trainerStudentConnection.create).mockResolvedValue({ id: "conn-new" } as any);

    const result = await connectionService.create({ studentId: "student-999", trainerId: "trainer-1" });

    expect(prisma.trainerStudentConnection.count).not.toHaveBeenCalled();
    expect(result.connection.id).toBe("conn-new");
  });
});

describe("connectionService.remove", () => {
  it("rejeita conexão inexistente", async () => {
    vi.mocked(prisma.trainerStudentConnection.findUnique).mockResolvedValue(null);

    await expect(connectionService.remove("conn-1", "student-1")).rejects.toMatchObject({ status: 404 });
  });

  it("rejeita remoção por um aluno que não é dono da conexão", async () => {
    vi.mocked(prisma.trainerStudentConnection.findUnique).mockResolvedValue({
      id: "conn-1",
      studentId: "outro-aluno",
      trainerId: "trainer-1",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await expect(connectionService.remove("conn-1", "student-1")).rejects.toMatchObject({ status: 403 });
  });

  it("remove a conexão quando o aluno é o dono", async () => {
    vi.mocked(prisma.trainerStudentConnection.findUnique).mockResolvedValue({
      id: "conn-1",
      studentId: "student-1",
      trainerId: "trainer-1",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await connectionService.remove("conn-1", "student-1");

    expect(prisma.trainerStudentConnection.delete).toHaveBeenCalledWith({ where: { id: "conn-1" } });
    expect(result.message).toBe("Conexão removida com sucesso");
  });
});
