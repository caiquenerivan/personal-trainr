import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    $executeRaw: vi.fn((strings: TemplateStringsArray) => ({ sql: strings.join("?") })),
    user: { delete: vi.fn((args: unknown) => ({ deleteUser: args })) },
  },
}));
vi.mock("../../repositories/user.repository", () => ({
  userRepository: { findByIdWithHash: vi.fn() },
}));
vi.mock("../../repositories/subscription.repository", () => ({
  subscriptionRepository: { findByUserId: vi.fn() },
}));
vi.mock("../../providers/AsaasProvider", () => ({
  asaasProvider: { cancelSubscription: vi.fn() },
}));
vi.mock("../upload.service", () => ({
  deleteFromCloudinary: vi.fn(() => Promise.resolve()),
}));

import { accountService } from "../account.service";
import { prisma } from "../../lib/prisma";
import { userRepository } from "../../repositories/user.repository";
import { subscriptionRepository } from "../../repositories/subscription.repository";
import { asaasProvider } from "../../providers/AsaasProvider";
import { deleteFromCloudinary } from "../upload.service";

const user = (over: Record<string, unknown> = {}) =>
  ({ id: "u-1", role: "ALUNO", passwordHash: null, avatarUrl: null, ...over }) as any;

describe("accountService.deleteOwnAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(subscriptionRepository.findByUserId).mockResolvedValue(null);
  });

  it("exige digitar EXCLUIR", async () => {
    await expect(accountService.deleteOwnAccount("u-1", { confirmation: "sim" })).rejects.toMatchObject({ status: 400 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("exige a senha quando a conta tem senha", async () => {
    vi.mocked(userRepository.findByIdWithHash).mockResolvedValue(user({ passwordHash: await bcrypt.hash("certa123", 4) }));

    await expect(
      accountService.deleteOwnAccount("u-1", { confirmation: "EXCLUIR", password: "errada" }),
    ).rejects.toMatchObject({ status: 401 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("conta só com login social exclui só com a confirmação", async () => {
    vi.mocked(userRepository.findByIdWithHash).mockResolvedValue(user());

    await accountService.deleteOwnAccount("u-1", { confirmation: "excluir" });

    const ops = vi.mocked(prisma.$transaction).mock.calls[0][0] as unknown as any[];
    const sql = ops.filter((o) => o.sql).map((o) => o.sql).join("\n");
    for (const table of ["WorkoutLog", "RoutineAssignment", "Routine", "Exercise", "TrainerRating"]) {
      expect(sql).toContain(`"${table}"`);
    }
    expect(ops.at(-1)).toEqual({ deleteUser: { where: { id: "u-1" } } });
  });

  it("não permite excluir conta de administrador", async () => {
    vi.mocked(userRepository.findByIdWithHash).mockResolvedValue(user({ role: "ADMIN" }));

    await expect(accountService.deleteOwnAccount("u-1", { confirmation: "EXCLUIR" })).rejects.toMatchObject({ status: 403 });
  });

  it("cancela a assinatura no Asaas antes de apagar", async () => {
    vi.mocked(userRepository.findByIdWithHash).mockResolvedValue(user({ role: "TRAINER", avatarUrl: "https://res.cloudinary.com/x/image/upload/v1/avatars/a.jpg" }));
    vi.mocked(subscriptionRepository.findByUserId).mockResolvedValue({ asaasSubscriptionId: "sub_1", status: "ACTIVE" } as any);

    await accountService.deleteOwnAccount("u-1", { confirmation: "EXCLUIR" });

    expect(asaasProvider.cancelSubscription).toHaveBeenCalledWith("sub_1");
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(deleteFromCloudinary).toHaveBeenCalled();
  });

  it("não apaga a conta se o cancelamento no Asaas falhar", async () => {
    vi.mocked(userRepository.findByIdWithHash).mockResolvedValue(user({ role: "TRAINER" }));
    vi.mocked(subscriptionRepository.findByUserId).mockResolvedValue({ asaasSubscriptionId: "sub_1", status: "ACTIVE" } as any);
    vi.mocked(asaasProvider.cancelSubscription).mockRejectedValue(new Error("Asaas down"));

    await expect(accountService.deleteOwnAccount("u-1", { confirmation: "EXCLUIR" })).rejects.toMatchObject({ status: 502 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
