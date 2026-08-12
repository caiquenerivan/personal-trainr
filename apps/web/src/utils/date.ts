// Formats a date-only value (stored as UTC midnight, e.g. "2026-09-15T00:00:00.000Z")
// using its UTC calendar date, not the browser's local timezone — otherwise a
// negative-offset timezone (e.g. UTC-3) rolls the displayed date back a day.
export function formatDateUTC(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}
