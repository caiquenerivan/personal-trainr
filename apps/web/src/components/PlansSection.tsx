import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const plans = [
  {
    tier: 'FREE',
    label: 'Grátis',
    price: 'R$ 0',
    period: '',
    limitLabel: 'até 3 alunos',
    features: ['Rotinas de treino', 'Acompanhamento básico'],
    highlight: false,
  },
  {
    tier: 'PRO',
    label: 'Pro',
    price: 'R$ 39,90',
    period: '/mês',
    limitLabel: 'até 20 alunos',
    features: ['Tudo do Grátis', 'Dashboard de aderência', 'Avaliação por estrelas'],
    highlight: true,
  },
  {
    tier: 'UNLIMITED',
    label: 'Ilimitado',
    price: 'R$ 89,90',
    period: '/mês',
    limitLabel: 'alunos ilimitados',
    features: ['Tudo do Pro', 'Sem limite de alunos'],
    highlight: false,
  },
];

export function PlansSection() {
  return (
    <section id="comecar" className="bg-base py-24 md:py-32 px-6 md:px-12 border-t border-white/10">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-accent-light text-sm tracking-widest uppercase font-semibold">
            Planos para personal trainers
          </p>
          <h2 className="font-title text-4xl md:text-5xl uppercase leading-tight mt-4">
            <span className="text-white">Escolha o plano </span>
            <span className="text-accent">certo pra você</span>
          </h2>
          <p className="text-text-secondary mt-4 max-w-xl mx-auto">
            Comece grátis e evolua conforme sua base de alunos cresce.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-light">
            Para alunos, a plataforma é 100% gratuita
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 items-start">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`relative rounded-2xl border p-8 flex flex-col transition hover:-translate-y-1 ${
                plan.highlight
                  ? 'bg-card border-accent shadow-[0_0_40px_-10px_rgba(175,145,80,0.35)] md:-translate-y-2'
                  : 'bg-card border-white/10 hover:border-accent/60'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-black">
                  Mais popular
                </span>
              )}

              <h3 className="font-title text-xl uppercase tracking-wide text-white">
                {plan.label}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-number text-4xl font-bold text-accent">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-text-secondary">{plan.period}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-text-secondary">{plan.limitLabel}</p>

              <ul className="mt-8 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-primary">
                    <Check size={16} className="mt-0.5 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/cadastro"
                className={`mt-8 inline-flex items-center justify-center rounded-lg h-12 px-6 text-sm font-bold uppercase tracking-wider transition ${
                  plan.highlight
                    ? 'bg-accent text-black hover:opacity-90 hover:scale-105'
                    : 'border border-border text-white hover:bg-white/5'
                }`}
              >
                Criar conta grátis
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
