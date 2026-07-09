import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, Flame } from 'lucide-react';
import levantador from '../assets/levantador.png';

const avatars = ['LA', 'MS', 'PH', 'CR'];

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-base overflow-hidden pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(175,145,80,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent/5 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-accent/5 blur-[80px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 min-h-[calc(100vh-5rem)] grid lg:grid-cols-2 items-center gap-12 md:gap-16 py-16 lg:py-0">
        {/* ─── Left Column ─────────────────────────────────────── */}
        <div className="flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent px-4 py-1.5 w-fit">
            <Flame size={14} className="text-accent-light" />
            <span className="text-accent-light text-xs font-semibold uppercase tracking-wider">
              Nova Plataforma
            </span>
          </div>

          <h1 className="font-title leading-tight text-5xl md:text-6xl lg:text-7xl uppercase">
            <span className="text-white">Supere seus limites com</span>{' '}
            <span className="text-accent">Personal Trainr<span className="font-body">.</span></span>
          </h1>

          <p className="text-text-secondary text-base md:text-lg leading-relaxed max-w-xl">
            A plataforma premium que conecta{' '}
            <strong className="text-white font-semibold">personal trainers</strong> e{' '}
            <strong className="text-white font-semibold">alunos</strong>. Monte rotinas,
            acompanhe evolução e transforme cada treino em resultado real.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/cadastro"
              className="inline-flex items-center gap-2 rounded-lg bg-accent text-black font-bold h-14 px-8 text-sm uppercase tracking-wider shadow-lg shadow-accent/25 transition hover:opacity-90 hover:scale-105 hover:shadow-xl hover:shadow-accent/50"
            >
              Começar agora
              <ArrowRight size={18} />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center rounded-lg border border-border text-white h-14 px-8 text-sm uppercase tracking-wider transition hover:bg-white/5"
            >
              Ver como funciona
            </a>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex">
              {avatars.map((initials, i) => (
                <div
                  key={initials}
                  className={`w-11 h-11 rounded-full bg-card border-2 border-base flex items-center justify-center text-accent text-xs font-bold -ml-2 first:ml-0`}
                >
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-text-secondary text-sm">
              <strong className="text-white font-number text-lg">+2.400</strong>{' '}
              atletas treinando com a gente
            </p>
          </div>
        </div>

        {/* ─── Right Column ────────────────────────────────────── */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] md:aspect-auto md:h-[600px] lg:h-[700px] rounded-2xl overflow-hidden border border-border/50">
          <img
            src={levantador}
            alt="Atleta treinando"
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Floating Card - Top Left (Aderência) */}
          <div className="absolute top-6 left-6 bg-card border border-accent p-4 rounded-xl shadow-lg">
            <p className="text-accent text-xs font-semibold uppercase tracking-wider">
              Aderência
            </p>
            <p className="text-white text-3xl font-number mt-1">92%</p>
          </div>

          {/* Floating Card - Bottom Right (Novo PR) */}
          <div className="absolute bottom-6 right-6 bg-card border border-border/50 p-4 rounded-xl shadow-lg flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Trophy size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-accent text-xs font-semibold uppercase tracking-wider">
                Novo PR
              </p>
              <p className="text-white text-md">
                Agachamento <span className="font-number">140</span>kg
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
