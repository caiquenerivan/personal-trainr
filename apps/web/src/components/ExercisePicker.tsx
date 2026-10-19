import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import type { ApiExercise } from '../api/exercises';

type ExercisePickerProps = {
  options: ApiExercise[];
  value: string;
  onChange: (exerciseId: string) => void;
  required?: boolean;
};

const MAX_RESULTS = 60;

// Busca sem acento e sem diferenciar maiúsculas: "cadeira extens" acha "Cadeira Extensora".
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Seleção de exercício com busca: cada palavra digitada precisa aparecer no nome
// ou no grupo muscular, em qualquer ordem.
export function ExercisePicker({ options, value, onChange, required }: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((opt) => opt.id === value) ?? null;

  const indexed = useMemo(
    () =>
      options.map((opt) => {
        const name = normalize(opt.name);
        return { opt, name, haystack: `${name} ${normalize(opt.muscle ?? '')}` };
      }),
    [options],
  );

  // Ordem: nome começa com a busca > todas as palavras no nome > casou pelo grupo muscular.
  const results = useMemo(() => {
    const q = normalize(query).trim();
    const words = q.split(/\s+/).filter(Boolean);
    if (!words.length) return indexed.slice(0, MAX_RESULTS).map(({ opt }) => opt);
    const rank = ({ name }: { name: string }) =>
      name.startsWith(q) ? 0 : words.every((w) => name.includes(w)) ? 1 : 2;
    return indexed
      .filter(({ haystack }) => words.every((w) => haystack.includes(w)))
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, MAX_RESULTS)
      .map(({ opt }) => opt);
  }, [indexed, query]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  useEffect(() => {
    const item = listRef.current?.children[highlight] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlight]);

  const choose = (opt: ApiExercise) => {
    onChange(opt.id);
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && results[highlight]) {
        e.preventDefault();
        choose(results[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  const inputValue = open ? query : selected ? `${selected.name}${selected.muscle ? ` — ${selected.muscle}` : ''}` : '';

  return (
    <div ref={rootRef} className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
      <input
        type="text"
        value={inputValue}
        placeholder={selected ? '' : 'Buscar exercício…'}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        className="w-full truncate rounded-lg border border-border bg-base p-3 pl-9 pr-16 text-text-primary outline-none focus:border-accent"
      />
      {/* mantém a validação nativa do formulário (campo obrigatório) */}
      <input
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        onChange={() => undefined}
        required={required}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
      />
      {selected && !open && (
        <button
          type="button"
          aria-label="Limpar exercício"
          onClick={() => onChange('')}
          className="absolute right-9 top-1/2 -translate-y-1/2 text-text-secondary transition hover:text-text-primary"
        >
          <X size={16} />
        </button>
      )}
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-accent" />

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
        >
          {results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-text-secondary">Nenhum exercício encontrado</li>
          ) : (
            results.map((opt, i) => (
              <li
                key={opt.id}
                role="option"
                aria-selected={opt.id === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(opt);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  i === highlight ? 'bg-accent/15 text-text-primary' : 'text-text-primary'
                } ${opt.id === value ? 'font-semibold' : ''}`}
              >
                {opt.name}
                {opt.muscle && <span className="text-text-secondary"> — {opt.muscle}</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
