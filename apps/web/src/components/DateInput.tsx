import { useRef } from 'react';
import { Calendar } from 'lucide-react';

type DateInputProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function parseDate(formatted: string): string {
  const match = formatted.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return '';
  const [, d, m, y] = match;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function DateInput({ value, onChange, label }: DateInputProps) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
  }

  function handleDisplayChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d/]/g, '');
    const parsed = parseDate(raw);
    if (parsed) {
      onChange(parsed);
    } else if (raw === '') {
      onChange('');
    }
  }

  function handleFocus() {
    hiddenRef.current?.showPicker?.();
  }

  return (
    <div className="relative">
      <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-accent z-10" />
      <input
        ref={hiddenRef}
        type="date"
        value={value}
        onChange={handleChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
        tabIndex={-1}
      />
      <input
        type="text"
        value={formatDate(value)}
        onChange={handleDisplayChange}
        onFocus={handleFocus}
        placeholder="dd/mm/aaaa"
        readOnly
        className="w-full rounded-lg border border-border bg-base p-3 pl-10 text-text-primary font-body text-sm outline-none focus:border-accent transition [color-scheme:dark] cursor-pointer"
      />
    </div>
  );
}
