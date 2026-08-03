import { api } from './client';

export type PlanTier = 'FREE' | 'PRO' | 'UNLIMITED';

export type SubscriptionData = {
  plan: PlanTier;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';
  studentLimit: number | null;
  currentPeriodEnd: string | null;
};

export async function getSubscription() {
  const response = await api.get<{ subscription: SubscriptionData }>('/api/users/subscription');
  return response.data;
}

export async function checkout(plan: 'PRO' | 'UNLIMITED', cpfCnpj: string) {
  const response = await api.post<{ checkoutUrl: string }>('/api/billing/checkout', { plan, cpfCnpj });
  return response.data;
}
