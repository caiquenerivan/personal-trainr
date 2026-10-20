const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatNum = (kg: number) => kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
export const formatKg = (kg: number) => `${formatNum(kg)} kg`;

export function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
