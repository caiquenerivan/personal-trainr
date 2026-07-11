import { Calendar } from 'lucide-react';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

type DateSelectorProps = {
  value: string;
  onChange: (iso: string) => void;
};

export function DateSelector({ value, onChange }: DateSelectorProps) {
  const date = value ? new Date(value + 'T12:00:00') : null;

  const day = date ? date.getDate() : 0;
  const month = date ? date.getMonth() : 0;
  const year = date ? date.getFullYear() : 0;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);

  function handleChange(field: 'day' | 'month' | 'year', val: number) {
    const d = field === 'day' ? val : day;
    const m = field === 'month' ? val : month;
    const y = field === 'year' ? val : year;

    if (!d || !y) {
      onChange('');
      return;
    }

    const clampedDay = Math.min(d, new Date(y, m + 1, 0).getDate());
    const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
    onChange(iso);
  }

  const daysInMonth = year && month + 1 ? new Date(year, month + 1, 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectClass =
    'w-full rounded-lg border border-border bg-base p-3 text-text-primary font-body text-sm outline-none focus:border-accent transition appearance-none cursor-pointer';

  return (
    <div className="relative">
      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent z-10" />
      <div className="grid grid-cols-3 gap-2 pl-9">
        <select
          value={day || ''}
          onChange={(e) => handleChange('day', Number(e.target.value))}
          className={selectClass}
        >
          <option value="" disabled>Dia</option>
          {days.map((d) => (
            <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
          ))}
        </select>

        <select
          value={month ?? ''}
          onChange={(e) => handleChange('month', Number(e.target.value))}
          className={selectClass}
        >
          <option value="" disabled>Mês</option>
          {MONTHS.map((name, idx) => (
            <option key={idx} value={idx}>{name}</option>
          ))}
        </select>

        <select
          value={year || ''}
          onChange={(e) => handleChange('year', Number(e.target.value))}
          className={selectClass}
        >
          <option value="" disabled>Ano</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
