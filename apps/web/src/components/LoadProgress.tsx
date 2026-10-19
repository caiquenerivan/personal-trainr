import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Dumbbell, Minus, Search } from 'lucide-react';
import {
  getExerciseLoadHistory,
  getLoadSummary,
  type ExerciseLoadHistory,
  type ExerciseLoadSummary,
} from '../api/progress';
import { Modal } from './Modal';

type LoadProgressProps = {
  // sem alunoId: evolução do próprio usuário; com alunoId: o personal vendo o aluno
  alunoId?: string;
};

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
const formatDate = (iso: string) => dateFmt.format(new Date(iso));
const formatNum = (kg: number) => kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const formatKg = (kg: number) => `${formatNum(kg)} kg`;

// número na fonte de métricas e a unidade em texto normal (a fonte de números não tem minúsculas)
function Kg({ value, className }: { value: number; className?: string }) {
  return (
    <span className={className}>
      <span className="font-number text-lg">{formatNum(value)}</span>
      <span className="ml-1 font-body text-xs text-text-secondary">kg</span>
    </span>
  );
}

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function Delta({ first, last }: { first: number; last: number }) {
  const diff = last - first;
  const pct = first > 0 ? Math.round((diff / first) * 100) : null;
  const up = diff > 0;
  const Icon = diff === 0 ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const color = diff === 0 ? 'text-text-secondary' : up ? 'text-accent-light' : 'text-red-400';
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${color}`}>
      <Icon size={16} />
      {diff > 0 ? '+' : ''}
      {formatKg(diff)}
      {pct !== null && diff !== 0 && <span className="text-xs font-normal">({diff > 0 ? '+' : ''}{pct}%)</span>}
    </span>
  );
}

// Gráfico de linha simples em SVG (sem dependência externa), nas cores do sistema.
function LoadChart({ points }: { points: Array<{ date: string; weight: number }> }) {
  const W = 420;
  const H = 220;
  const pad = { l: 44, r: 24, t: 16, b: 34 };
  if (points.length === 0) return null;
  const weights = points.map((p) => p.weight);
  let min = Math.min(...weights);
  let max = Math.max(...weights);
  if (min === max) {
    min = Math.max(0, min - 5);
    max = max + 5;
  }
  const x = (i: number) => pad.l + (points.length === 1 ? (W - pad.l - pad.r) / 2 : (i / (points.length - 1)) * (W - pad.l - pad.r));
  const y = (w: number) => pad.t + (1 - (w - min) / (max - min)) * (H - pad.t - pad.b);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.weight).toFixed(1)}`).join(' ');
  const ticks = [min, (min + max) / 2, max];
  const labelIdx = points.length <= 2 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Evolução da carga ao longo do tempo">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="stroke-border" strokeDasharray="3 4" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-text-secondary text-[14px]">
            {Math.round(t)}
          </text>
        </g>
      ))}
      <path d={path} fill="none" className="stroke-accent" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.weight)} r={4} className="fill-accent-light">
          <title>{`${formatDate(p.date)}: ${formatKg(p.weight)}`}</title>
        </circle>
      ))}
      {labelIdx.map((i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 10}
          textAnchor={points.length > 1 && i === 0 ? 'start' : points.length > 1 && i === points.length - 1 ? 'end' : 'middle'}
          className="fill-text-secondary text-[14px]"
        >
          {formatDate(points[i].date)}
        </text>
      ))}
    </svg>
  );
}

export function LoadProgress({ alunoId }: LoadProgressProps) {
  const [exercises, setExercises] = useState<ExerciseLoadSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ExerciseLoadSummary | null>(null);
  const [history, setHistory] = useState<ExerciseLoadHistory | null>(null);

  useEffect(() => {
    setExercises(null);
    getLoadSummary(alunoId)
      .then(setExercises)
      .catch(() => setError('Não foi possível carregar a evolução de carga.'));
  }, [alunoId]);

  useEffect(() => {
    if (!selected) return;
    setHistory(null);
    getExerciseLoadHistory(selected.exerciseId, alunoId)
      .then(setHistory)
      .catch(() => setHistory({ exerciseId: selected.exerciseId, name: selected.name, points: [] }));
  }, [selected, alunoId]);

  const filtered = useMemo(() => {
    if (!exercises) return [];
    const words = normalize(query).split(/\s+/).filter(Boolean);
    if (!words.length) return exercises;
    return exercises.filter((e) => {
      const hay = normalize(`${e.name} ${e.muscle ?? ''}`);
      return words.every((w) => hay.includes(w));
    });
  }, [exercises, query]);

  if (error) {
    return <p className="rounded-xl bg-card p-6 text-sm text-text-secondary">{error}</p>;
  }

  if (!exercises) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="rounded-xl bg-card p-8 text-center">
        <Dumbbell className="mx-auto text-accent" size={28} />
        <p className="mt-3 text-sm text-text-primary">Ainda não há treinos registrados.</p>
        <p className="mt-1 text-xs text-text-secondary">
          A evolução aparece aqui conforme os exercícios são concluídos com a carga informada.
        </p>
      </div>
    );
  }

  const chartPoints = (history?.points ?? []).filter((p): p is { date: string; weight: number } => p.weight != null);

  return (
    <div className="space-y-5">
      <div className="relative max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar exercício…"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-lg border border-border bg-base p-3 pl-9 text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((e) => (
          <button
            key={e.exerciseId}
            type="button"
            onClick={() => setSelected(e)}
            className="rounded-xl border border-white/10 bg-card p-5 text-left transition hover:border-accent"
          >
            <p className="font-body text-sm font-semibold text-text-primary">{e.name}</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              {e.muscle ?? '—'} · {e.sessions} {e.sessions === 1 ? 'vez' : 'vezes'}
            </p>

            {e.first && e.last ? (
              <>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-text-secondary">Antes</span>
                    <Kg value={e.first.weight} className="text-text-primary" />
                    <span className="block text-[11px] text-text-secondary">{formatDate(e.first.date)}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase tracking-wider text-text-secondary">Agora</span>
                    <Kg value={e.last.weight} className="text-accent-light" />
                    <span className="block text-[11px] text-text-secondary">{formatDate(e.last.date)}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  <Delta first={e.first.weight} last={e.last.weight} />
                  {e.maxWeight != null && (
                    <span className="text-xs text-text-secondary">Máx. {formatKg(e.maxWeight)}</span>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-4 text-xs text-text-secondary">Feito sem carga registrada.</p>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-sm text-text-secondary">Nenhum exercício encontrado.</p>}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''}>
        {!history ? (
          <div className="h-56 animate-pulse rounded-lg bg-base" />
        ) : chartPoints.length === 0 ? (
          <p className="text-sm text-text-secondary">Nenhuma carga registrada para este exercício.</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-base p-3">
              <LoadChart points={chartPoints} />
            </div>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-white/10">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-[11px] uppercase tracking-wider text-text-secondary">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Data</th>
                    <th className="px-3 py-2 text-right font-semibold">Carga</th>
                  </tr>
                </thead>
                <tbody>
                  {[...chartPoints].reverse().map((p, i) => (
                    <tr key={i} className="border-t border-white/5 text-text-primary">
                      <td className="px-3 py-2">{formatDate(p.date)}</td>
                      <td className="px-3 py-2 text-right">{formatKg(p.weight)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
