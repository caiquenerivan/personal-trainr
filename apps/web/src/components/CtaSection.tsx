import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function CtaSection() {
  return (
    <section id="comecar" className="bg-base py-24 md:py-32 px-6 md:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="bg-card rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(175,145,80,0.05)] p-12 md:p-16 text-center relative overflow-hidden transition hover:border-accent">
          <div className="absolute top-10 -left-10 w-64 h-64 rounded-full bg-accent/10 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-10 -right-10 w-80 h-80 rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent/5 blur-[150px] pointer-events-none" />
          <p className="text-accent-light text-sm tracking-widest uppercase font-semibold">
            Pronto para começar?
          </p>
          <h2 className="font-title text-4xl md:text-5xl lg:text-6xl uppercase leading-tight mt-4">
            <span className="text-white">Seu próximo </span>
            <span className="text-accent">recorde</span>
            <span className="text-white"> começa hoje<span className="font-body">.</span></span>
          </h2>
          <p className="text-text-secondary mt-6 max-w-2xl mx-auto leading-relaxed">
            Junte-se a milhares de treinadores e alunos que já elevaram o nível dos
            treinos.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
            <Link
              to="/cadastro"
              className="inline-flex items-center gap-2 rounded-lg bg-accent text-black font-bold h-14 px-8 text-sm uppercase tracking-wider shadow-lg shadow-accent/25 transition hover:opacity-90 hover:scale-105 hover:shadow-xl hover:shadow-accent/50"
            >
              Criar conta grátis
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center border border-border text-text-primary px-8 py-4 rounded-xl transition hover:bg-white/5"
            >
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
