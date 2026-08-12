import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../repositories/user.repository", () => ({
  userRepository: { findById: vi.fn() },
}));
vi.mock("../../repositories/subscription.repository", () => ({
  subscriptionRepository: {
    findByUserId: vi.fn(),
    createDefault: vi.fn(),
    updateByUserId: vi.fn(),
    findByAsaasSubscriptionId: vi.fn(),
  },
}));
vi.mock("../../providers/AsaasProvider", () => ({
  asaasProvider: {
    createCustomer: vi.fn(),
    createSubscription: vi.fn(),
    getSubscriptionPayments: vi.fn(),
    getSubscription: vi.fn(),
  },
}));

import { billingService } from "../billing.service";
import { userRepository } from "../../repositories/user.repository";
import { subscriptionRepository } from "../../repositories/subscription.repository";
import { asaasProvider } from "../../providers/AsaasProvider";

const baseSubscription = {
  id: "sub-1",
  userId: "trainer-1",
  plan: "FREE" as const,
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

describe("billingService.checkout", () => {
  it("rejeita quem não é TRAINER", async () => {
    await expect(billingService.checkout("user-1", "ALUNO", "PRO", "12345678900")).rejects.toMatchObject({
      status: 403,
    });
  });

  it("rejeita usuário inexistente", async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(null);

    await expect(billingService.checkout("trainer-1", "TRAINER", "PRO", "12345678900")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("cria cliente na Asaas na primeira assinatura e retorna o link de checkout", async () => {
    vi.mocked(userRepository.findById).mockResolvedValue({
      id: "trainer-1",
      name: "Personal",
      email: "personal@example.com",
    } as any);
    vi.mocked(subscriptionRepository.findByUserId).mockResolvedValue(baseSubscription);
    vi.mocked(asaasProvider.createCustomer).mockResolvedValue({
      id: "cus_1",
      name: "Personal",
      email: "personal@example.com",
      cpfCnpj: "12345678900",
    });
    vi.mocked(asaasProvider.createSubscription).mockResolvedValue({
      id: "sub_asaas_1",
      status: "ACTIVE",
      value: 39.9,
      nextDueDate: "2026-08-10",
    });
    vi.mocked(asaasProvider.getSubscriptionPayments).mockResolvedValue([
      { id: "pay_1", status: "PENDING", invoiceUrl: "https://asaas.test/i/pay_1", dueDate: "2026-08-10" },
    ]);

    const result = await billingService.checkout("trainer-1", "TRAINER", "PRO", "123.456.789-00");

    expect(asaasProvider.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ cpfCnpj: "12345678900" }),
    );
    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "trainer-1",
      expect.objectContaining({ plan: "PRO", status: "INCOMPLETE", asaasSubscriptionId: "sub_asaas_1" }),
    );
    expect(result.checkoutUrl).toBe("https://asaas.test/i/pay_1");
  });

  it("reaproveita o asaasCustomerId existente em vez de criar outro cliente", async () => {
    vi.mocked(userRepository.findById).mockResolvedValue({
      id: "trainer-1",
      name: "Personal",
      email: "personal@example.com",
    } as any);
    vi.mocked(subscriptionRepository.findByUserId).mockResolvedValue({
      ...baseSubscription,
      asaasCustomerId: "cus_existente",
    });
    vi.mocked(asaasProvider.createSubscription).mockResolvedValue({
      id: "sub_asaas_2",
      status: "ACTIVE",
      value: 39.9,
      nextDueDate: "2026-08-10",
    });
    vi.mocked(asaasProvider.getSubscriptionPayments).mockResolvedValue([
      { id: "pay_2", status: "PENDING", invoiceUrl: "https://asaas.test/i/pay_2", dueDate: "2026-08-10" },
    ]);

    await billingService.checkout("trainer-1", "TRAINER", "PRO", "12345678900");

    expect(asaasProvider.createCustomer).not.toHaveBeenCalled();
    expect(asaasProvider.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_existente" }),
    );
  });

  it("lança erro 502 se a Asaas não retornar link de pagamento", async () => {
    vi.mocked(userRepository.findById).mockResolvedValue({
      id: "trainer-1",
      name: "Personal",
      email: "personal@example.com",
    } as any);
    vi.mocked(subscriptionRepository.findByUserId).mockResolvedValue({
      ...baseSubscription,
      asaasCustomerId: "cus_existente",
    });
    vi.mocked(asaasProvider.createSubscription).mockResolvedValue({
      id: "sub_asaas_3",
      status: "ACTIVE",
      value: 39.9,
      nextDueDate: "2026-08-10",
    });
    vi.mocked(asaasProvider.getSubscriptionPayments).mockResolvedValue([]);

    await expect(billingService.checkout("trainer-1", "TRAINER", "PRO", "12345678900")).rejects.toMatchObject({
      status: 502,
    });
  });
});

describe("billingService.handleWebhook", () => {
  it("ignora payload sem event ou sem subscription", async () => {
    await billingService.handleWebhook({});
    await billingService.handleWebhook({ event: "PAYMENT_CONFIRMED" });

    expect(subscriptionRepository.findByAsaasSubscriptionId).not.toHaveBeenCalled();
  });

  it("ignora evento de uma assinatura que não existe na nossa base", async () => {
    vi.mocked(subscriptionRepository.findByAsaasSubscriptionId).mockResolvedValue(null);

    await billingService.handleWebhook({
      event: "PAYMENT_CONFIRMED",
      payment: { subscription: "sub_desconhecida" },
    });

    expect(subscriptionRepository.updateByUserId).not.toHaveBeenCalled();
  });

  it("ativa a assinatura em PAYMENT_CONFIRMED usando o nextDueDate da assinatura Asaas", async () => {
    vi.mocked(subscriptionRepository.findByAsaasSubscriptionId).mockResolvedValue({
      ...baseSubscription,
      asaasSubscriptionId: "sub_asaas_1",
    });
    vi.mocked(asaasProvider.getSubscription).mockResolvedValue({
      id: "sub_asaas_1",
      status: "ACTIVE",
      value: 39.9,
      nextDueDate: "2026-10-10",
    });

    await billingService.handleWebhook({
      event: "PAYMENT_CONFIRMED",
      payment: { subscription: "sub_asaas_1", dueDate: "2026-09-10" },
    });

    expect(asaasProvider.getSubscription).toHaveBeenCalledWith("sub_asaas_1");
    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "trainer-1",
      expect.objectContaining({ status: "ACTIVE", currentPeriodEnd: new Date("2026-10-10") }),
    );
  });

  it("recorre ao dueDate do pagamento se a busca do nextDueDate na Asaas falhar", async () => {
    vi.mocked(subscriptionRepository.findByAsaasSubscriptionId).mockResolvedValue({
      ...baseSubscription,
      asaasSubscriptionId: "sub_asaas_1",
    });
    vi.mocked(asaasProvider.getSubscription).mockRejectedValue(new Error("Asaas down"));

    await billingService.handleWebhook({
      event: "PAYMENT_RECEIVED",
      payment: { subscription: "sub_asaas_1", dueDate: "2026-09-10" },
    });

    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "trainer-1",
      expect.objectContaining({ status: "ACTIVE", currentPeriodEnd: new Date("2026-09-10") }),
    );
  });

  it("marca como PAST_DUE em PAYMENT_OVERDUE", async () => {
    vi.mocked(subscriptionRepository.findByAsaasSubscriptionId).mockResolvedValue({
      ...baseSubscription,
      asaasSubscriptionId: "sub_asaas_1",
    });

    await billingService.handleWebhook({
      event: "PAYMENT_OVERDUE",
      payment: { subscription: "sub_asaas_1" },
    });

    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith("trainer-1", { status: "PAST_DUE" });
  });

  it("marca como CANCELED em PAYMENT_DELETED", async () => {
    vi.mocked(subscriptionRepository.findByAsaasSubscriptionId).mockResolvedValue({
      ...baseSubscription,
      asaasSubscriptionId: "sub_asaas_1",
    });

    await billingService.handleWebhook({
      event: "PAYMENT_DELETED",
      payment: { subscription: "sub_asaas_1" },
    });

    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith("trainer-1", { status: "CANCELED" });
  });
});
