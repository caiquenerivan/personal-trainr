import { Link } from 'react-router-dom';
import { Dumbbell, Users, ClipboardList, BarChart3, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: ClipboardList,
    title: 'Rotinas Personalizadas',
    desc: 'Crie divisões de treino AB, ABC, ABCDE com exercícios, séries e repetições.',
  },
  {
    icon: Users,
    title: 'Gestão de Alunos',
    desc: 'Atribua rotinas aos seus alunos com controle de validade por período.',
  },
  {
    icon: BarChart3,
    title: 'Progresso Detalhado',
    desc: 'Acompanhe a evolução com check-ins de treino e histórico completo.',
  },
  {
    icon: Dumbbell,
    title: 'Banco de Exercícios',
    desc: 'Catálogo completo com GIFs, vídeos, grupo muscular e observações.',
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-base font-body text-text-primary">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 md:px-12">
        <Link to="/" className="font-title text-2xl uppercase text-accent tracking-wider">
          Personal Trainr
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/login"
            className="rounded-lg border border-accent px-5 py-2 text-sm uppercase text-accent transition hover:bg-accent hover:text-black"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="rounded-lg bg-accent px-5 py-2 text-sm uppercase text-black transition hover:opacity-90"
          >
            Cadastre-se
          </Link>
        </nav>
      </header>

      <section className="flex flex-col items-center justify-center px-6 py-24 text-center md:py-36">
        <h1 className="font-title text-5xl uppercase leading-tight tracking-wider text-text-primary md:text-7xl">
          Transforme Seus
          <span className="block text-accent">Treinos em Resultados</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-text-secondary">
          A plataforma completa para personal trainers gerenciarem rotinas, acompanharem
          a evolução dos alunos e maximizarem resultados.
        </p>
        <Link
          to="/cadastro"
          className="mt-10 inline-flex items-center gap-3 rounded-xl bg-accent px-10 py-4 font-bold uppercase text-black transition hover:opacity-90"
        >
          Comece Agora
          <ArrowRight size={20} />
        </Link>
      </section>

      <section className="border-t border-border px-6 py-20 md:px-12">
        <h2 className="font-title text-3xl uppercase text-center tracking-wider text-text-primary">
          Tudo que você precisa
        </h2>
        <div className="mx-auto mt-14 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-card p-6 transition hover:opacity-90"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <f.icon size={24} className="text-accent" />
              </div>
              <h3 className="font-title text-lg uppercase tracking-wide text-text-primary">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-text-secondary">
        &copy; {new Date().getFullYear()} Personal Trainr. Todos os direitos reservados.
      </footer>
    </main>
  );
}
