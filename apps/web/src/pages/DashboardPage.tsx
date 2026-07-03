const metrics = [
  {
    label: 'Alunos ativos',
    value: '24',
    subtitle: 'de 30 vagas',
    trend: '+3 esta semana',
    up: true,
  },
  {
    label: 'Rotinas criadas',
    value: '18',
    subtitle: 'ao todo',
    trend: '2 modelos em uso',
    up: false,
  },
  {
    label: 'Modelos salvos',
    value: '7',
    subtitle: 'rotinas modelos',
    trend: '33% em rotinas ativas',
    up: false,
  },
];

export function DashboardPage() {
  return (
    <section className="mx-auto max-w-7xl">
      <h1 className="font-title text-3xl uppercase text-text-primary">PAINEL</h1>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {metrics.map((m) => (
          <article
            key={m.label}
            className="rounded-xl border border-border bg-panel p-5"
          >
            <p className="font-body text-xs uppercase tracking-wider text-text-secondary">
              {m.label}
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <strong className="font-title text-3xl text-accent">{m.value}</strong>
              <span className="text-xs text-text-secondary">{m.subtitle}</span>
            </div>
            <p className="mt-2 text-xs text-text-secondary">{m.trend}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
