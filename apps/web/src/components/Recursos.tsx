import {
  MessageCircle,
  Clock,
  LayoutDashboard,
  Dumbbell,
  Trophy,
  Target,
} from 'lucide-react';

const recursos = [
  {
    icon: MessageCircle,
    title: 'Comunicação fluida',
    desc: 'Chat direto entre treinador e aluno, sem fricção.',
  },
  {
    icon: Clock,
    title: 'Histórico de treinos',
    desc: 'Cada sessão registrada, com timeline e comparativos.',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboards interativos',
    desc: 'Visualize progresso, volume e consistência em tempo real.',
  },
  {
    icon: Dumbbell,
    title: 'Rotinas dinâmicas',
    desc: 'Ajuste séries, reps e cargas em segundos.',
  },
  {
    icon: Trophy,
    title: 'PRs e conquistas',
    desc: 'Celebre recordes pessoais automaticamente.',
  },
  {
    icon: Target,
    title: 'Metas claras',
    desc: 'Defina objetivos e acompanhe o caminho até eles.',
  },
];

export function Recursos() {
  return (
    <section id="recursos" className="bg-card py-24 px-6 md:px-12 border-t border-[#D9D9D9]/10">
      <div className="mx-auto max-w-7xl">
        {/* ─── Header ──────────────────────────────────────────── */}
        <div className="text-center mb-16">
          <h2 className="font-title text-5xl uppercase leading-tight">
            <span className="text-white">Tudo o que você </span>
            <span className="text-accent">precisa</span>
          </h2>
          <p className="text-text-secondary mt-4 max-w-xl mx-auto">
            Cada recurso pensado para levar sua rotina ao próximo nível.
          </p>
        </div>

        {/* ─── Grid ────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-8">
          {recursos.map((r, i) => (
            <div
              key={r.title}
              className={`bg-base rounded-xl border border-white/10 p-8 transition hover:-translate-y-1 hover:border-accent hover:opacity-90 hover:shadow-[0_0_30px_-8px_rgba(175,145,80,0.25)] ${
                i === 0 ? 'md:col-span-2' : ''
              } ${i === 5 ? 'md:col-span-3' : ''}`}
            >
              {i === 0 ? (
                <>
                  <div className="w-16 h-16 rounded-xl bg-card border border-accent flex items-center justify-center mb-6">
                    <r.icon size={28} className="text-accent" />
                  </div>
                  <h3 className="text-white font-bold uppercase text-lg tracking-wider">
                    {r.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed mt-2 max-w-xl">
                    {r.desc}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-xl bg-card border border-accent flex items-center justify-center">
                    <r.icon size={24} className="text-accent" />
                  </div>
                  <h3 className="text-white font-bold uppercase mt-6 mb-2 text-base tracking-wider">
                    {r.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{r.desc}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
