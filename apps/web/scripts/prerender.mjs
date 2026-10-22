/**
 * Pós-build de SEO. Roda depois do `vite build` (cliente) e do build SSR de
 * src/prerender-entry.tsx (em dist-ssr/) e gera, em dist/:
 * - um HTML por rota pública, com title/description/canonical próprios e,
 *   quando possível, o conteúdo da página já renderizado;
 * - app.html: a casca da SPA (noindex) para as rotas logadas;
 * - sitemap.xml.
 */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const ssrDir = resolve(root, 'dist-ssr');
const { render, resolveMeta, PUBLIC_PAGES, SITE_URL } = await import(
  pathToFileURL(resolve(ssrDir, 'prerender-entry.js')).href
);

const template = readFileSync(resolve(dist, 'index.html'), 'utf8');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function setHead(html, meta) {
  const swaps = [
    [/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`],
    [/(<meta name="description" content=")[^"]*/, `$1${esc(meta.description)}`],
    [/(<meta name="robots" content=")[^"]*/, `$1${meta.index ? 'index, follow' : 'noindex, nofollow'}`],
    [/(<link rel="canonical" href=")[^"]*/, `$1${meta.canonical}`],
    [/(<meta property="og:url" content=")[^"]*/, `$1${meta.canonical}`],
    [/(<meta property="og:title" content=")[^"]*/, `$1${esc(meta.title)}`],
    [/(<meta property="og:description" content=")[^"]*/, `$1${esc(meta.description)}`],
    [/(<meta name="twitter:title" content=")[^"]*/, `$1${esc(meta.title)}`],
    [/(<meta name="twitter:description" content=")[^"]*/, `$1${esc(meta.description)}`],
  ];
  for (const [re, rep] of swaps) {
    if (!re.test(html)) throw new Error(`prerender: index.html sem a tag ${re}`);
    html = html.replace(re, rep);
  }
  return html;
}

function setBody(html, body) {
  const start = html.indexOf('<div id="root">');
  const end = html.indexOf('</div>\n  <!--/root-->');
  if (start < 0 || end < 0) throw new Error('prerender: marcadores do #root não encontrados');
  return html.slice(0, start) + `<div id="root">${body}` + html.slice(end);
}

function page(path) {
  let html = setHead(template, resolveMeta(path));
  const body = render(path);
  if (body) html = setBody(html, body);
  return html;
}

// Casca da SPA para rotas logadas e desconhecidas: nunca indexar.
writeFileSync(resolve(dist, 'app.html'), setHead(template, resolveMeta('/app')));

const routes = [...Object.keys(PUBLIC_PAGES), '/excluir-conta'];
for (const path of routes) {
  const file = path === '/' ? 'index.html' : `${path.slice(1)}.html`;
  writeFileSync(resolve(dist, file), page(path));
  console.log(`prerender: ${path} -> dist/${file}${render(path) ? ' (conteúdo renderizado)' : ''}`);
}

const today = new Date().toISOString().slice(0, 10);
const urls = Object.keys(PUBLIC_PAGES)
  .map((p) => `  <url>\n    <loc>${SITE_URL}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${p === '/' ? '1.0' : '0.5'}</priority>\n  </url>`)
  .join('\n');
writeFileSync(
  resolve(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
);

rmSync(ssrDir, { recursive: true, force: true });
