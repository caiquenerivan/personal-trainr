import { useState } from 'react';
import { AxiosError } from 'axios';
import { Check, Target } from 'lucide-react';
import { api } from '../api/client';
import { Modal } from './Modal';

// Mesma lista do app (packages/shared OBJECTIVES) e da validação do backend.
export const OBJECTIVES = [
  'Hipertrofia',
  'Emagrecimento',
  'Definição',
  'Força',
  'Condicionamento',
  'Resistência',
  'Saúde e bem-estar',
];

function storedUser(): Record<string, unknown> | null {
  try {
    const raw = window.localStorage.getItem('personaltrainr.user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredObjective(): string | null {
  const objective = storedUser()?.objective;
  return typeof objective === 'string' ? objective : null;
}

// Card "Objetivo" do painel: mostra o objetivo do perfil e abre a escolha.
export function ObjectiveCard() {
  const [objective, setObjective] = useState<string | null>(getStoredObjective);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(value: string) {
    setSaving(value);
    setError(null);
    try {
      await api.put('/api/users/profile', { objective: value });
      const user = storedUser();
      if (user) window.localStorage.setItem('personaltrainr.user', JSON.stringify({ ...user, objective: value }));
      setObjective(value);
      setOpen(false);
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.message : null;
      setError(message || 'Não foi possível salvar o objetivo.');
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-card border border-border/40 p-4 flex items-center gap-4 text-left transition-all duration-300 hover:border-accent/50 shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_0_28px_rgba(175,145,80,0.3)]"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Target size={24} />
        </div>
        <div className="min-w-0">
          <span className="block text-[10px] uppercase font-bold text-text-secondary">Objetivo</span>
          <span className="font-body text-sm font-bold text-text-primary uppercase tracking-wide truncate block">
            {objective ?? 'Definir'}
          </span>
        </div>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Seu objetivo">
        <div className="space-y-2">
          {OBJECTIVES.map((value) => {
            const active = value === objective;
            return (
              <button
                key={value}
                type="button"
                disabled={!!saving}
                onClick={() => choose(value)}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${
                  active ? 'border-accent text-accent' : 'border-border text-text-primary hover:border-accent/60'
                } disabled:opacity-60`}
              >
                {value}
                {saving === value ? (
                  <span className="text-xs text-text-secondary">Salvando...</span>
                ) : (
                  active && <Check size={16} />
                )}
              </button>
            );
          })}
          {error && (
            <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
