import axios from "axios";

const asaas = axios.create({
  baseURL: process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3",
  headers: {
    access_token: process.env.ASAAS_API_KEY || "",
    "Content-Type": "application/json",
  },
});

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

export interface AsaasSubscription {
  id: string;
  status: string;
  value: number;
  nextDueDate: string;
}

export interface AsaasPayment {
  id: string;
  status: string;
  invoiceUrl: string;
  dueDate: string;
}

export const asaasProvider = {
  async createCustomer(data: { name: string; email: string; cpfCnpj: string }): Promise<AsaasCustomer> {
    const response = await asaas.post("/customers", data);
    return response.data;
  },

  async createSubscription(data: {
    customer: string;
    value: number;
    description: string;
    nextDueDate: string;
  }): Promise<AsaasSubscription> {
    const response = await asaas.post("/subscriptions", {
      customer: data.customer,
      billingType: "UNDEFINED",
      value: data.value,
      nextDueDate: data.nextDueDate,
      cycle: "MONTHLY",
      description: data.description,
    });
    return response.data;
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await asaas.delete(`/subscriptions/${subscriptionId}`);
  },

  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    const response = await asaas.get(`/subscriptions/${subscriptionId}`);
    return response.data;
  },

  async getSubscriptionPayments(subscriptionId: string): Promise<AsaasPayment[]> {
    const response = await asaas.get(`/payments`, { params: { subscription: subscriptionId } });
    return response.data.data;
  },
};
