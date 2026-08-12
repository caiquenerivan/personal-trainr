import { useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { CreditCard } from 'lucide-react';
import { listSubscriptions, updateSubscription, type AdminSubscription, type PlanTier, type SubscriptionStatus } from '../../api/admin';
import { Modal } from '../../components/Modal';

const PLAN_LABELS: Record<PlanTier, string> = { FREE: 'Grátis', PRO: 'Pro', UNLIMITED: 'Ilimitado' };
const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Ativa',
  PAST_DUE: 'Em atraso',
  CANCELED: 'Cancelada',
  INCOMPLETE: 'Incompleta',
};
const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  ACTIVE: 'bg-green-900/40 text-green-400',
  PAST_DUE: 'bg-yellow-900/40 text-yellow-400',
  CANCELED: 'bg-red-900/40 text-red-400',
  INCOMPLETE: 'bg-base text-text-secondary',
};

export function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<AdminSubscription | null>(null);
  const [form, setForm] = useState<{ plan: PlanTier; status: SubscriptionStatus }>({ plan: 'FREE', status: 'ACTIVE' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  function loadSubscriptions() {
    setLoading(true);
    listSubscriptions()
      .then(setSubscriptions)
      .catch(() => showToast('Erro ao carregar assinaturas'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  function openEdit(sub: AdminSubscription) {
    setEditTarget(sub);
    setForm({ plan: sub.plan, status: sub.status });
  }

  async function handleSave() {
    if (!editTarget) return;
    setSaving(true);
    try {
      await updateSubscription(editTarget.userId, form);
      showToast('Assinatura atualizada com sucesso!');
      setEditTarget(null);
      loadSubscriptions();
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message || 'Erro ao atualizar assinatura' : 'Erro ao atualizar assinatura';
      showToast(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div>
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-accent">PAINEL ADMIN</span>
        <h1 className="mt-2 font-title text-4xl uppercase text-white sm:text-5xl">Assinaturas</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-text-secondary">
          Visualize e ajuste manualmente planos e status de billing dos trainers.
        </p>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-text-secondary">
              <th className="px-5 py-4">Trainer</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Plano</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Vencimento</th>
              <th className="px-5 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-text-secondary">Carregando...</td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-text-secondary">Nenhuma assinatura encontrada.</td>
              </tr>
            ) : (
              subscriptions.map((s) => (
                <tr key={s.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-4 text-text-primary">{s.user.name}</td>
                  <td className="px-5 py-4 text-text-secondary">{s.user.email}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-base px-3 py-1 text-xs uppercase text-accent">{PLAN_LABELS[s.plan]}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs uppercase ${STATUS_STYLES[s.status]}`}>{STATUS_LABELS[s.status]}</span>
                  </td>
                  <td className="px-5 py-4 text-text-secondary">
                    {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => openEdit(s)}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs uppercase text-text-secondary transition hover:bg-base hover:text-accent"
                    >
                      <CreditCard size={14} />
                      Ajustar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Ajustar assinatura">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Trainer: <strong className="text-text-primary">{editTarget?.user.name}</strong>
          </p>
          <div>
            <label className="mb-1 block text-xs uppercase text-text-secondary">Plano</label>
            <select
              value={form.plan}
              onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as PlanTier }))}
              className="w-full rounded-lg border border-border bg-base px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="FREE">Grátis</option>
              <option value="PRO">Pro</option>
              <option value="UNLIMITED">Ilimitado</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-text-secondary">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SubscriptionStatus }))}
              className="w-full rounded-lg border border-border bg-base px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="ACTIVE">Ativa</option>
              <option value="PAST_DUE">Em atraso</option>
              <option value="CANCELED">Cancelada</option>
              <option value="INCOMPLETE">Incompleta</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEditTarget(null)} className="rounded-lg px-4 py-2.5 text-sm text-text-secondary transition hover:text-text-primary">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-accent-light disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-card px-5 py-3 text-sm text-text-primary shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </section>
  );
}
