# Personal Trainr - MVP Implementation Progress

## [x] Phase 1: Setup do Monorepo e Infraestrutura Local
- [x] Inicializar Monorepo com npm workspaces
- [x] Configurar `docker-compose.yml` local com bancos PostgreSQL separados
- [x] Criar estrutura base dos pacotes (`apps/api-gateway`, `apps/auth-service`, `apps/workout-service`, `apps/web`)

## [x] Phase 2: Auth & User Service (Base Inicial)
- [x] Configurar Node/Express/TypeScript + Prisma no auth-service
- [x] Implementar rotas de Cadastro/Login base

## [x] Phase 3: Workout & Routine Service (Base Inicial)
- [x] Configurar Node/Express/TypeScript + Prisma no workout-service
- [x] Implementar rotas iniciais de treinos

## [x] Phase 4: API Gateway & Dashboards (Base Inicial)
- [x] Configurar roteamento REST no API Gateway

## [x] Phase 4.5: Backend Overhaul & Reestruturação Arquitetural (CONCLUÍDO)
- [x] **Arquitetura:** Refatorar `auth-service` e `workout-service` para o padrão estrito `Routes -> Controllers -> Services -> Repositories`.
- [x] **Segurança:** Implementar e validar middlewares de proteção (`cors`, `helmet`, `express-rate-limit`) e checagem rígida de JWT.
- [x] **Prisma Schema (Database):**
  - [x] Atualizar enums `RoutineType` e `Day` para suportar divisões até `ABCDE`.
  - [x] Atualizar model `User`: adicionar campos opcionais `avatarUrl` e `phone` (focado em WhatsApp).
  - [x] Atualizar model `Exercise`: adicionar campos opcionais `muscle`, `weightTrack` e `observations`.
  - [x] Desacoplar `Routine`: remover `alunoId` e `expiresAt` do model principal (tornando-a um modelo/template reutilizável).
  - [x] Criar model `RoutineAssignment` para gerenciar a atribuição de rotinas aos alunos, contendo `expiresAt` (calculado dinamicamente em dias a partir da data atual) e flag `isActive`.

## [x] Phase 5: Web Frontend - Landing Page, Cadastro & Correções de Auth
- [x] Criar Landing Page institucional e chamativa na rota `/` (ou `/home`).
- [x] Criar tela de cadastro completo de usuários (`/cadastro`).
- [x] Refatorar tela de Login: corrigir inversão de cores (`bg-menu: #262626`, `bg-base: #333333`), adicionar botões de navegação para Home e Cadastro.
- [x] Implementar Roteamento Inteligente pós-login baseado na role do JWT (Personal -> `/painel` | Aluno -> `/aluno/painel`).

## [x] Phase 6: Web Frontend - Trainer Dashboard (Dashboard do Personal)
- [x] **Ajuste Construtor:** Remover campo de expiração da criação/edição de modelos de rotina.
- [x] **Visualização de Rotinas:** Criar tela `/rotinas/ver/:id` com card de detalhes, botão de editar e excluir.
- [x] **Edição de Rotinas:** Criar tela `/rotinas/editar/:id` herdando a estrutura dinâmica do construtor.
- [x] **Modais de Segurança:** Adicionar modal de confirmação ao excluir rotina, exibindo o número de alunos impactados.
- [x] **Gestão de Alunos:** Criar tela `/alunos` listando cards com Nome, Peso, Altura e status da rotina. Adicionar ação para vincular rotina ao aluno (definindo ali os dias de expiração).
- [x] **Banco de Exercícios:** Criar tela `/exercicios` com listagem geral, busca, visualização de detalhes e modal/botão para cadastrar novos exercícios.
- [x] **Rotina Própria:** Criar interface para o Personal visualizar e executar seus próprios treinos (comportando-se como aluno).

## [x] Phase 7: Web Frontend - Student Dashboard (Dashboard do Aluno)
- [x] Criar painel principal do aluno (`/aluno/painel`) com resumo e botão "Iniciar Treino de Hoje".
- [x] Criar tela de listagem de treinos atribuídos (ativos/histórico).
- [x] Criar tela de Perfil (URL da foto, WhatsApp, peso, altura) com PUT via API.
- [x] Criar tela de Execução ("Treino do Dia") com abas A-E, checkboxes, inputs de carga e POST para WorkoutLog.
- [x] Criar Modal de detalhe de exercício (GIF, grupo muscular, observações).
- [x] Backend: Adicionar weight/height ao User + PUT /api/users/profile.
- [x] Backend: Adicionar weightUsed ao WorkoutLog + POST /api/workout/complete.

## [x] Phase 7.5: UI/UX Refinements & Global Search (CONCLUÍDO)
- [x] **Backend & Schema:** Adicionar `birthDate DateTime?` no model `User`.
- [x] **Cadastro:** Incluir upload de avatar e DatePicker para data de nascimento.
- [x] **Navegação:** Adicionar menu Hamburger para mobile controlando a Sidebar.
- [x] **Busca Global:** Criar barra de pesquisa global no Header.
- [x] **Gestão de Alunos (View):** Refatorar `/alunos` para o design premium:
  - Subtítulo "Gestão de Alunos" e estatísticas dinâmicas no topo.
  - Barra de busca local e Toggles de filtro (Todos / Ativos / Inativos).
  - Refatoração dos Cards: Efeito hover com borda/glow `#AF9150`, card interno para métricas (Peso, Altura, Idade), indicador de rotina e botões de ação (Ver Detalhes / Vincular).
  - Modal de detalhes ao clicar no card.

## [ ] Phase 8: Mobile App (React Native / Expo) - Aluno (Adiado)
- [ ] Inicializar projeto Expo e migrar funcionalidades do dashboard do aluno.