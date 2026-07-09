import { Users, ClipboardList, BarChart3, Smartphone, CheckCheck, Target } from 'lucide-react';
import croppedDarkLogo from '../assets/cropped-dark-logo.png';

const trainerItems = [
  {
    icon: Users,
    title: 'Gestão de alunos ativos',
    desc: 'Organize sua clientela com perfis completos e histórico individual.',
  },
  {
    icon: ClipboardList,
    title: 'Rotinas personalizadas',
    desc: 'Crie divisões de treino AB, ABC, ABCDE com exercícios e cargas.',
  },
  {
    icon: BarChart3,
    title: 'Acompanhamento de evolução',
    desc: 'Gráficos de progresso e check-ins para cada aluno.',
  },
];

const studentItems = [
  {
    icon: Smartphone,
    title: 'Treinos no mobile',
    desc: 'Acesse sua rotina do dia direto do celular, a qualquer hora.',
  },
  {
    icon: CheckCheck,
    title: 'Marque como concluído',
    desc: 'Registre séries, repetições e cargas ao finalizar cada exercício.',
  },
  {
    icon: Target,
    title: 'Metas pessoais',
    desc: 'Defina objetivos semanais e mensais e acompanhe sua evolução.',
  },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="bg-base border-t border-[#D9D9D9]/10">
      {/* ─── Transition Band ────────────────────────────────────── */}
      <div className="w-full bg-[#D9D9D9] flex items-center justify-center py-8 md:py-12">
        <img
          src={croppedDarkLogo}
          alt=""
          className="h-12 md:h-16 object-contain"
        />
      </div>
      <div className="py-24 px-6 md:px-12">
        <div className="mx-auto max-w-7xl">
        {/* ─── Header ──────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <h2 className="font-title text-5xl uppercase leading-tight">
            <span className="text-white">Uma plataforma<span className="font-body">,</span> </span>
            <span className="text-accent">dois mundos</span>
          </h2>
          <p className="text-text-secondary mt-4 max-w-xl mx-auto">
            Construída para treinadores exigentes e alunos comprometidos.
          </p>
        </div>

        {/* ─── Grid ────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Card 1 — Personal Trainer */}
          <div className="bg-card rounded-2xl border border-white/10 p-10 flex flex-col gap-8 transition hover:border-accent hover:shadow-[0_0_40px_-10px_rgba(175,145,80,0.3)]">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg border border-accent flex items-center justify-center">
                  <Users size={20} className="text-accent" />
                </div>
                <span className="text-accent-light text-xs font-semibold uppercase tracking-wider">
                  Para Personal Trainers
                </span>
              </div>
              <h3 className="font-title text-4xl uppercase text-white leading-tight">
                Comande sua operação
              </h3>
              <p className="text-text-secondary mt-3 leading-relaxed">
                Centralize alunos, rotinas e resultados em um workspace pensado para
                escalar seu negócio.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {trainerItems.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <item.icon size={18} className="text-accent" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm uppercase">
                      {item.title}
                    </h4>
                    <p className="text-text-secondary text-sm mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2 — Alunos */}
          <div className="bg-card rounded-2xl border border-white/10 p-10 flex flex-col gap-8 relative overflow-hidden bg-gradient-to-br from-card to-card/80 shadow-[0_0_30px_-5px_rgba(175,145,80,0.15)] transition hover:border-accent hover:shadow-[0_0_50px_-5px_rgba(175,145,80,0.35)]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(175,145,80,0.06),transparent_60%)] pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg border border-accent flex items-center justify-center">
                  <Smartphone size={20} className="text-accent" />
                </div>
                <span className="text-accent-light text-xs font-semibold uppercase tracking-wider">
                  Para Alunos
                </span>
              </div>
              <h3 className="font-title text-4xl uppercase text-white leading-tight">
                Treine com clareza
              </h3>
              <p className="text-text-secondary mt-3 leading-relaxed">
                Seu treino do dia na palma da mão. Marque, registre e evolua — sem
                desculpas.
              </p>
            </div>

            <div className="relative z-10 flex flex-col gap-6">
              {studentItems.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <item.icon size={18} className="text-accent" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm uppercase">
                      {item.title}
                    </h4>
                    <p className="text-text-secondary text-sm mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
