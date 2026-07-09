# Personal Trainr - MVP Implementation Progress

## [x] Phase 1 a 6: Infra, Backend, Auth e Trainer Dashboard
- [x] Setup, Prisma, Controllers/Services, Middlewares.
- [x] Landing Page (Base), Cadastro, Login.
- [x] Painel do Personal: Gestão de Alunos, Construtor de Rotinas, Exercícios.

## [x] Phase 7: Web Frontend - Student Dashboard (Base)
- [x] Painel Principal do Aluno, Tela de Execução e Perfil.

## [x] Phase 7.5: UI/UX Refinements & Global Search
- [x] Upload de Avatar, Data de Nascimento, Busca Global e Hover Cards (Gestão de Alunos).

## [x] Phase 7.6: Student Dashboard UI Redesign (CONCLUÍDO)
- [x] **Menu Lateral (Aluno):** Isolar itens específicos (Painel, Personal, Perfil, Sair) e adicionar logo `logo-fitness-gold.png`.
- [x] **Painel Principal (`/aluno/painel`):**
  - [x] Adicionar saudação dinâmica ("OLÁ, $NOME").
  - [x] Criar grid de 4 stat cards (Sequência, Objetivo, Peso, Altura).
  - [x] Adicionar seletores de treino (A, B, C, D, E).
  - [x] **Card Treino do Dia:** Título, barra de progresso e lista de exercícios interativa.
  - [x] **Card Histórico:** Cabeçalho com totalizadores, lista de treinos com calendário.
- [x] **Perfil & Conta (`/aluno/perfil`):**
  - [x] **Card de Resumo:** Dados gerais e métricas.
  - [x] **Sistema de Abas:** Alternar entre "Perfil" e "Conta".
  - [x] **Abas:** Formulários de dados pessoais e de segurança.
- [x] **Backend (Segurança):** Endpoint `PUT /api/users/change-password`.

## [x] Phase 7.7: Premium Landing Page Redesign (CONCLUÍDO)
- [x] **Navbar:** Layout minimalista (`bg-[#333333]`), Logo `logo-circle-golden.png`, 3 Links centrais (Como funciona, Recursos, Começar), Botões "Entrar" (Outline) e "Cadastrar" (Sólido `#AF9150`, hover zoom + glow).
- [x] **Hero Section:**
  - [x] **Coluna Esquerda:** Badge "NOVA PLATAFORMA" com ícone Flame, Headline "SUPERE SEUS LIMITES COM PERSONAL TRAINR.", Subtítulo, Botões de Ação (CTA com hover zoom + glow), Prova Social (Avatars).
  - [x] **Coluna Direita:** Imagem `levantador.png` dentro de card com overlay escuro e cards flutuantes de métricas ("Aderência 92%" e "Novo PR 140kg").
  - [x] Pontos de glow dourado no background.
- [x] **Seção "Como Funciona":** Título "UMA PLATAFORMA, DOIS MUNDOS" e 2 cards simétricos (Personal Trainer vs. Alunos) com listas de funcionalidades, ícones, hover border gold + outer glow.
- [x] **Seção "Recursos":** Fundo invertido (`bg-card`), Grid de 6 cards com ícones em borda accent, hover com `-translate-y-1` + glow + border gold.
- [x] **Seção CTA ("Começar"):** Card centralizado com glow dourado forte, borda sutil (`hover:border-accent`), Headline "SEU PRÓXIMO RECORDE COMEÇA HOJE", botão "Criar Conta Grátis" (mesmo estilo do Hero).
- [x] **Footer:** 3 colunas (Brand, Conta, Plataforma), slogan "TREINE FORTE, EVOLUA SEMPRE.", bordas sutis entre seções.
- [x] Pontuação corrigida (vírgulas e pontos finais com `font-body` onde a `font-title` não renderiza).

## [ ] Phase 8: Mobile App (React Native / Expo) - Aluno (Adiado)
- [ ] Inicializar projeto Expo e migrar funcionalidades do dashboard do aluno.