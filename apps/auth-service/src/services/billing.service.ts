import { userRepository } from "../repositories/user.repository";
import { subscriptionRepository } from "../repositories/subscription.repository";
import { asaasProvider } from "../providers/AsaasProvider";
import { PLAN_PRICES } from "../config/plans";
import { logger } from "../lib/logger";

function todayPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().substring(0, 10);
}

export const billingService = {
  async checkout(userId: string, role: string, plan: "PRO" | "UNLIMITED", cpfCnpj: string) {
    if (role !== "TRAINER") {
      throw { status: 403, message: "Apenas treinadores podem assinar um plano" };
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: "Usuário não encontrado" };
    }

    let subscription = await subscriptionRepository.findByUserId(userId);
    if (!subscription) {
      subscription = await subscriptionRepository.createDefault(userId);
    }

    let asaasCustomerId = subscription.asaasCustomerId;
    if (!asaasCustomerId) {
      const customer = await asaasProvider.createCustomer({
        name: user.name,
        email: user.email,
        cpfCnpj: cpfCnpj.replace(/\D/g, ""),
      });
      asaasCustomerId = customer.id;
    }

    const asaasSubscription = await asaasProvider.createSubscription({
      customer: asaasCustomerId,
      value: PLAN_PRICES[plan],
      description: `Personal Trainr - Plano ${plan === "PRO" ? "Pro" : "Ilimitado"}`,
      nextDueDate: todayPlusDays(3),
    });

    await subscriptionRepository.updateByUserId(userId, {
      plan,
      status: "INCOMPLETE",
      asaasCustomerId,
      asaasSubscriptionId: asaasSubscription.id,
    });

    const payments = await asaasProvider.getSubscriptionPayments(asaasSubscription.id);
    const checkoutUrl = payments[0]?.invoiceUrl ?? null;

    if (!checkoutUrl) {
      throw { status: 502, message: "Não foi possível gerar o link de pagamento" };
    }

    return { checkoutUrl };
  },

  async handleWebhook(payload: any) {
    const event = payload?.event as string | undefined;
    const payment = payload?.payment;
    if (!event || !payment?.subscription) return;

    const subscription = await subscriptionRepository.findByAsaasSubscriptionId(payment.subscription);
    if (!subscription) return;

    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      // payment.dueDate is the due date of the payment that was JUST paid
      // (effectively "now"), not when access should expire. The Asaas
      // subscription's nextDueDate already reflects the next billing cycle,
      // which is what access should actually be valid until.
      let periodEnd = payment.dueDate ? new Date(payment.dueDate) : null;
      try {
        const asaasSubscription = await asaasProvider.getSubscription(payment.subscription);
        if (asaasSubscription.nextDueDate) {
          periodEnd = new Date(asaasSubscription.nextDueDate);
        }
      } catch (err) {
        logger.error({ err, subscriptionId: payment.subscription }, "Failed to fetch Asaas subscription nextDueDate, falling back to payment.dueDate");
      }

      await subscriptionRepository.updateByUserId(subscription.userId, {
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
      });
    } else if (event === "PAYMENT_OVERDUE") {
      await subscriptionRepository.updateByUserId(subscription.userId, { status: "PAST_DUE" });
    } else if (event === "PAYMENT_DELETED" || event === "PAYMENT_REFUNDED") {
      await subscriptionRepository.updateByUserId(subscription.userId, { status: "CANCELED" });
    }
  },
};
