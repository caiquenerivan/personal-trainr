/**
 * Metadados de SEO das páginas públicas. Usado em dois lugares:
 * - no navegador, pelo SeoManager (atualiza título/description/canonical a cada rota);
 * - no build, pelo scripts/prerender.mjs (gera um HTML estático por rota pública).
 */
export const SITE_URL = 'https://www.personaltrainr.club';
export const SITE_NAME = 'Personal Trainr';
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export interface PageMeta {
  title: string;
  description: string;
}

export const DEFAULT_META: PageMeta = {
  title: 'Personal Trainr — App para Personal Trainer montar treinos e acompanhar alunos',
  description:
    'Monte rotinas de treino, envie para seus alunos e acompanhe a evolução de cargas e a aderência em um só lugar. ' +
    'App de treino para personal trainers e alunos, com biblioteca de mais de 800 exercícios. Comece grátis.',
};

/** Rotas públicas indexáveis (entram no sitemap e são pré-renderizadas). */
export const PUBLIC_PAGES: Record<string, PageMeta> = {
  '/': DEFAULT_META,
  '/cadastro': {
    title: 'Criar conta grátis | Personal Trainr',
    description:
      'Crie sua conta grátis no Personal Trainr: personal trainers montam e enviam treinos para os alunos, ' +
      'e alunos seguem o treino do dia pelo site ou app.',
  },
  '/login': {
    title: 'Entrar | Personal Trainr',
    description: 'Acesse sua conta do Personal Trainr para montar treinos, acompanhar alunos ou fazer o treino do dia.',
  },
  '/privacidade': {
    title: 'Política de Privacidade | Personal Trainr',
    description: 'Saiba como o Personal Trainr coleta, usa e protege os dados de personal trainers e alunos.',
  },
  '/termos': {
    title: 'Termos de Uso | Personal Trainr',
    description: 'Termos de Uso da plataforma Personal Trainr para personal trainers e alunos.',
  },
};

/** Rotas públicas que não devem aparecer no Google (mas precisam existir). */
const NOINDEX_PUBLIC: Record<string, PageMeta> = {
  '/excluir-conta': {
    title: 'Excluir conta | Personal Trainr',
    description: 'Solicite a exclusão da sua conta e dos seus dados do Personal Trainr.',
  },
};

export interface ResolvedMeta extends PageMeta {
  canonical: string;
  index: boolean;
}

export function resolveMeta(pathname: string): ResolvedMeta {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const pub = PUBLIC_PAGES[path];
  if (pub) return { ...pub, canonical: SITE_URL + (path === '/' ? '/' : path), index: true };
  const hidden = NOINDEX_PUBLIC[path];
  if (hidden) return { ...hidden, canonical: SITE_URL + path, index: false };
  // Área logada, convites, callbacks etc.: nada disso deve ser indexado.
  return { ...DEFAULT_META, title: SITE_NAME, canonical: SITE_URL + path, index: false };
}
