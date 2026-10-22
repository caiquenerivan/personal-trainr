/**
 * Entrada SSR usada só no build (scripts/prerender.mjs): renderiza as páginas
 * públicas em HTML estático para os buscadores lerem sem executar JavaScript.
 */
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';

export { PUBLIC_PAGES, SITE_URL, resolveMeta } from './seo';

const PAGES: Record<string, () => ReactElement> = {
  '/': () => <LandingPage />,
  '/privacidade': () => <PrivacyPolicyPage />,
  '/termos': () => <TermsPage />,
};

/** HTML do corpo da rota, ou null se ela não é pré-renderizada. */
export function render(path: string): string | null {
  const page = PAGES[path];
  if (!page) return null;
  return renderToString(<StaticRouter location={path}>{page()}</StaticRouter>);
}
