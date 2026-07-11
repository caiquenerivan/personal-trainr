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
## [x] Phase 8: Feature de Conexão Aluno-Professor (Branch: `feat/aluno-professor-conexao`) (CONCLUÍDO)
- [x] **Backend Schema:** Atualizar Prisma com `TrainerProfile`, `TrainerStudentConnection`, enums `UF` e `Role.ADMIN`, e novos campos no `User` (username, instagram, bio).
- [x] **Backend Controllers/Services:** - [x] Rota para atualizar o `TrainerProfile` (apenas para role TRAINER).
  - [x] Rota `POST /connections` para criar o vínculo entre aluno e professor.
  - [x] Rota `GET /connections/my-students` e `GET /connections/my-trainers`.
- [x] **Frontend Aluno (`/aluno/personal`):** - [x] Listar o(s) personal(is) atrelado(s) a ele.
  - [x] Criar interface (busca ou botão) para o aluno solicitar ou aceitar conexão com um personal.
- [x] **Frontend Personal:**
  - [x] Aba nas configurações para preencher CREF, Estado, Especialidades.
  - [x] Ajustar a tela `/alunos` para listar apenas alunos vindos da tabela `TrainerStudentConnection`.

## [x] Phase 8.5: Trainer Dashboard Redesign (CONCLUÍDO)
- [x] **Visão Geral (`/painel`):** Refatorar a página principal do personal baseada no novo UI de "Command Center".
  - [x] **Header:** Título dinâmico de boas vindas com botão de ação rápida.
  - [x] **Cards de Resumo (Stats):** Grid com 4 métricas (Alunos Ativos, Treinos Concluídos, Rotinas em Uso, Adesão Média) utilizando `font-number`.
  - [x] **Lista de Alunos Ativos:** Card com listagem resumida dos alunos, mostrando rotina atual e avatar.
  - [x] **Feed de Atividade Recente:** Lista estilo timeline com badges sobrepostos nos avatares (ícones de check, balança, atualizações) e textos ricos descrevendo as ações.
  - [x] **Rotinas Mais Usadas:** Grid de 2 colunas exibindo o ranking das rotinas ativas com mini-barra indicadora de volume de alunos.
- [x] **Mock de Dados (Temporário):** Enquanto o backend não possui os logs de atividade complexos, criar dados mockados robustos no frontend para garantir que o visual do Dashboard funcione perfeitamente.

## [x] Phase 8.6: Aba Progresso - Engajamento & Desempenho (CONCLUÍDO)
- [x] **Backend:** Criar endpoint `GET /api/trainers/students-progress` que calcule por aluno: Frequência (Weekly Goal), Streak Semanal, Treinos nos últimos 7 dias e Porcentagem de Adesão Geral.
- [x] **Frontend - Layout Base:** Criar página `/painel/progresso` com Header "ENGAJAMENTO & DESEMPENHO" e grid de cards.
- [x] **Frontend - Card de Progresso:** - [x] Topo com Avatar, Nome, @username e Badge de Status.
  - [x] Grid 2x2 interno (`bg-[#333333]`) para as 4 mini-métricas.
  - [x] Componente `DonutChart` em SVG para renderizar o círculo de porcentagem.
  - [x] Lógica condicional de cores: `>= 75%` (Excelente - Dourado), `>= 50%` (Boa - Amarelo/Dourado), `< 50%` (Atenção - Laranja/Vermelho claro), `< 30%` (Risco de Abandono - Vermelho forte).

## [ ] Phase 9: Mobile App (React Native / Expo) - Aluno (Adiado)
- [ ] Inicializar projeto Expo e migrar funcionalidades do dashboard do aluno.