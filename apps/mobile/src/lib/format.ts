export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// "há 5 minutos", como o formatDistanceToNow do web (sem trazer date-fns).
export function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - Date.parse(iso));
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  const months = Math.floor(days / 30);
  return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

export function daysUntil(iso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

export function ageFrom(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
