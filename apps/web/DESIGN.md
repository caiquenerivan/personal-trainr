# Design System - Personal Trainr

## Cores (Tailwind Tokens)
- **Menu / Cards Background (`menu`, `card`)**: `#262626`
- **Main / Base Background (`base`)**: `#333333`
- **Accent / Destaques / Ícones / Botões Primários (`accent`)**: `#AF9150`
- **Accent Light / Texto pequeno em destaque (`accent-light`)**: `#D4B060`
- **Texto Principal (`text-primary`)**: `#D9D9D9`
- **Texto Secundário / Subtítulos / Descrições (`text-secondary`)**: `#A3A3A3`
- **Bordas (`border`)**: `#4A4A4A`

## Tipografia
- **Títulos (`font-title`)**: `Backed` (Fonte pesada para títulos de página e seções. Fallback: `sans-serif`).
- **Números de Destaque (`font-number`)**: `Gehors` (Fonte específica para contadores, métricas e estatísticas. Fallback: `sans-serif`).
- **Corpo / Parágrafos / Inputs (`font-body`)**: `Play` (Textos gerais de alta legibilidade).
- **Nota**: Backed não possui pontuação — vírgulas e pontos devem usar `font-body`.

## Convenções de Código
- **Cores fixas**: Nunca usar valores hex hardcoded (`#A7A7A7`, `#4A4A4A`, `#D9D9D9`, `#505050`, `#111111`). Sempre usar tokens do Tailwind.
- **Bordas sutis**: Usar `border-white/10` para bordas de cartão, `border-border` para bordas sólidas.
- **Eyebrow / rótulos pequenos (text-xs, text-sm)**: Usar `text-accent-light` em vez de `text-accent` para garantir contraste AA.

## Componentes UI (Landing Page)
- **Navbar**: `bg-base`, `border-border/30`. Mobile: hamburger com dropdown em `bg-card`.
- **Hero**: Gradientes radiais com `accent` a 5-8%. Badge com `accent-light`. Imagem com `aspect-[4/5]` em mobile, altura fixa em desktop. `loading="lazy"`.
- **Seções**: Separadas por `border-t border-white/10`.
- **Cards ComoFunciona**: `bg-card` / `border-white/10`, `hover:border-accent` com glow.
- **Cards Recursos**: `bg-base` / `border-white/10`, `hover:-translate-y-1`. Primeiro card `md:col-span-2`, último `md:col-span-3`.
- **CTA**: `bg-card` / `rounded-2xl` / `hover:border-accent`. Glow points com blur.
- **Footer**: `bg-card`, 3 colunas. Slogan com vírgula e ponto em `font-body`.

## Componentes UI (Dashboard - App)
- **Menu Lateral**: Fundo `#262626`. Cada item deve possuir um ícone colorido com `#AF9150` à esquerda. O item ativo ganha fundo `#333333`.
- **Inputs**: Fundo `#333333`, padding interno amplo (`p-3` ou similar) para respiro, texto `#D9D9D9`.
- **Selects**: Fundo `#333333`, padding interno, com seta dropdown obrigatoriamente customizada para a cor `#AF9150`.
- **Cards de Exercício**: Fundo `#3A3A3A`, bordas sutis. Sem preenchimento dourado exagerado.
- **Gráficos**: Gráficos devem seguir o padrão de cores do sistema, com destaque para o `accent`.