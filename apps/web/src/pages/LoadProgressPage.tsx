import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LoadProgress } from '../components/LoadProgress';

// Evolução de carga: do próprio usuário (/aluno/evolucao, /minha-evolucao)
// ou de um aluno visto pelo personal (/progresso/:alunoId/carga).
export function LoadProgressPage() {
  const { alunoId } = useParams();
  const location = useLocation();
  const studentName = (location.state as { name?: string } | null)?.name;

  return (
    <section className="mx-auto max-w-7xl">
      {alunoId && (
        <Link
          to="/progresso"
          className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-text-secondary transition hover:text-accent"
        >
          <ArrowLeft size={14} /> Progresso dos alunos
        </Link>
      )}
      <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-accent-light">
        {alunoId ? studentName ?? 'Aluno' : 'Seu desempenho'}
      </span>
      <h1 className="mt-2 font-title text-4xl uppercase text-text-primary sm:text-5xl">Evolução de carga</h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-text-secondary">
        Compare a carga do começo com a atual em cada exercício. Toque em um exercício para ver o gráfico e o histórico completo.
      </p>
      <div className="mt-8">
        <LoadProgress alunoId={alunoId} />
      </div>
    </section>
  );
}
