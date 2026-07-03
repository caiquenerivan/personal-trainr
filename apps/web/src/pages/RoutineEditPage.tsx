import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { RoutineBuilder } from '../components/RoutineBuilder';

export function RoutineEditPage() {
  const { id } = useParams();

  if (!id) {
    return (
      <section className="mx-auto max-w-7xl">
        <h1 className="font-title text-3xl uppercase text-text-primary">ROTINA NÃO ENCONTRADA</h1>
        <Link to="/rotinas" className="mt-4 inline-flex items-center gap-2 text-sm text-accent transition hover:opacity-80">
          <ArrowLeft size={16} /> Voltar para Rotinas
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center gap-4 border-b border-border pb-6">
        <Link
          to={`/rotinas/ver/${id}`}
          className="flex items-center justify-center rounded-lg p-2 text-accent transition hover:bg-base min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-title text-3xl uppercase text-text-primary">EDITAR ROTINA</h1>
      </div>

      <RoutineBuilder routineId={id} />
    </section>
  );
}
