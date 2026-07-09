import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-card">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid md:grid-cols-3 gap-12">
        {/* Coluna 1 — Brand */}
        <div>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md border border-accent flex items-center justify-center">
              <Dumbbell size={20} className="text-accent" />
            </div>
            <span className="font-title text-white uppercase tracking-wider text-lg">
              Personal Trainr
            </span>
          </Link>
          <p className="text-text-secondary mt-4 max-w-xs leading-relaxed text-sm">
            A plataforma premium para personal trainers e alunos que buscam resultado
            real.
          </p>
        </div>

        {/* Coluna 2 — Conta */}
        <div>
          <h4 className="text-accent text-sm tracking-widest uppercase font-semibold mb-6">
            Conta
          </h4>
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="text-text-primary hover:text-white transition text-sm"
            >
              Login
            </Link>
            <Link
              to="/cadastro"
              className="text-text-primary hover:text-white transition text-sm"
            >
              Cadastrar
            </Link>
          </div>
        </div>

        {/* Coluna 3 — Plataforma */}
        <div>
          <h4 className="text-accent text-sm tracking-widest uppercase font-semibold mb-6">
            Plataforma
          </h4>
          <div className="flex flex-col gap-3">
            <Link
              to="#como-funciona"
              className="text-text-primary hover:text-white transition text-sm"
            >
              Como funciona
            </Link>
            <Link
              to="#recursos"
              className="text-text-primary hover:text-white transition text-sm"
            >
              Recursos
            </Link>
          </div>
        </div>
      </div>

      {/* Rodapé Inferior */}
      <div className="border-t border-border/30 py-6 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-secondary">
            &copy; 2026 Personal Trainr. Todos os direitos reservados.
          </p>
          <p className="text-xs text-accent tracking-widest uppercase font-title">
            Treine forte<span className="font-body">,</span> evolua sempre<span className="font-body">.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
