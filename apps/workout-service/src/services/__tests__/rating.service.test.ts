import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    trainerStudentConnection: {
      findFirst: vi.fn(),
    },
  },
}));
vi.mock("../../repositories/rating.repository", () => ({
  ratingRepository: {
    upsert: vi.fn(),
    findByTrainerAndStudent: vi.fn(),
    getAggregateForTrainer: vi.fn(),
  },
}));
vi.mock("../../repositories/subscription.repository", () => ({
  subscriptionRepository: {
    findByUserId: vi.fn(),
  },
}));

import { ratingService } from "../rating.service";
import { prisma } from "../../lib/prisma";
import { ratingRepository } from "../../repositories/rating.repository";
import { subscriptionRepository } from "../../repositories/subscription.repository";

const proSubscription = {
  id: "sub-1",
  userId: "trainer-1",
  plan: "PRO" as const,
  status: "ACTIVE" as const,
  asaasCustomerId: null,
  asaasSubscriptionId: null,
  currentPeriodEnd: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ratingService.rate", () => {
  it("rejeita avaliação de aluno sem conexão ativa com o trainer", async () => {
    vi.mocked(prisma.trainerStudentConnection.findFirst).mockResolvedValue(null);

    await expect(ratingService.rate("student-1", "trainer-1", 5)).rejects.toMatchObject({
      status: 403,
      message: "Você precisa estar vinculado a este personal para avaliá-lo",
    });
    expect(ratingRepository.upsert).not.toHaveBeenCalled();
  });

  it("rejeita avaliação quando o trainer está no plano Grátis", async () => {
    vi.mocked(prisma.trainerStudentConnection.findFirst).mockResolvedValue({ id: "conn-1" } as any);
    vi.mocked(subscriptionRepository.findByUserId).mockResolvedValue(null);

    await expect(ratingService.rate("student-1", "trainer-1", 5)).rejects.toMatchObject({
      status: 403,
      message: "Avaliações estão disponíveis apenas para personais nos planos Pro e Ilimitado.",
    });
    expect(ratingRepository.upsert).not.toHaveBeenCalled();
  });

  it("registra a avaliação quando há conexão ativa e o trainer está no plano Pro", async () => {
    vi.mocked(prisma.trainerStudentConnection.findFirst).mockResolvedValue({ id: "conn-1" } as any);
    vi.mocked(subscriptionRepository.findByUserId).mockResolvedValue(proSubscription);
    vi.mocked(ratingRepository.getAggregateForTrainer).mockResolvedValue({ average: 5, count: 1 });
    vi.mocked(ratingRepository.findByTrainerAndStudent).mockResolvedValue({
      id: "r-1",
      trainerId: "trainer-1",
      studentId: "student-1",
      rating: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await ratingService.rate("student-1", "trainer-1", 5);

    expect(ratingRepository.upsert).toHaveBeenCalledWith("trainer-1", "student-1", 5);
    expect(result.average).toBe(5);
    expect(result.myRating).toBe(5);
  });
});

describe("ratingService.getForTrainer", () => {
  it("arredonda a média para 2 casas decimais", async () => {
    vi.mocked(ratingRepository.getAggregateForTrainer).mockResolvedValue({ average: 4.666666, count: 3 });

    const result = await ratingService.getForTrainer("trainer-1");

    expect(result.average).toBe(4.67);
    expect(result.count).toBe(3);
    expect(result.myRating).toBeNull();
  });

  it("retorna average null quando não há avaliações", async () => {
    vi.mocked(ratingRepository.getAggregateForTrainer).mockResolvedValue({ average: null, count: 0 });

    const result = await ratingService.getForTrainer("trainer-1");

    expect(result.average).toBeNull();
    expect(result.count).toBe(0);
  });

  it("inclui myRating quando um studentId é passado", async () => {
    vi.mocked(ratingRepository.getAggregateForTrainer).mockResolvedValue({ average: 4, count: 2 });
    vi.mocked(ratingRepository.findByTrainerAndStudent).mockResolvedValue({
      id: "r-1",
      trainerId: "trainer-1",
      studentId: "student-1",
      rating: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await ratingService.getForTrainer("trainer-1", "student-1");

    expect(result.myRating).toBe(3);
  });
});
