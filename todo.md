# Personal Trainr - MVP Implementation Progress

## [x] Phase 1 a 6: Infra, Backend, Auth e Trainer Dashboard
- [x] Setup, Prisma, Controllers/Services, Middlewares.
- [x] Landing Page, Cadastro, Login.
- [x] Painel do Personal: Gestão de Alunos, Construtor de Rotinas, Exercícios.

## [x] Phase 7: Web Frontend - Student Dashboard (Base)
- [x] Painel Principal do Aluno, Tela de Execução e Perfil.

## [x] Phase 7.5: UI/UX Refinements & Global Search
- [x] Upload de Avatar, Data de Nascimento, Busca Global e Hover Cards (Gestão de Alunos).

## [x] Phase 7.6: Student Dashboard UI Redesign (FOCO ATUAL)
- [x] **Menu Lateral (Aluno):** Isolar itens específicos (Painel, Personal, Perfil, Sair) e adicionar logo `logo-fitness-gold.png`.
- [x] **Painel Principal (`/aluno/painel`):**
  - [x] Adicionar saudação dinâmica ("OLÁ, $NOME").
  - [x] Criar grid de 4 stat cards (Sequência, Objetivo, Peso, Altura).
  - [x] Adicionar seletores de treino (A, B, C, D, E).
  - [x] **Card Treino do Dia:** Título, barra de progresso e lista de exercícios interativa (checkbox, detalhes).
  - [x] **Card Histórico:** Cabeçalho com totalizadores, lista de treinos concluídos com ícone de calendário customizado e tempo de conclusão.
- [x] **Perfil & Conta (`/aluno/perfil`):**
  - [x] **Card de Resumo:** Exibir Foto, Nome, Objetivo, Email, Telefone, Peso, Altura, Idade e Treinos Finalizados.
  - [x] **Sistema de Abas:** Alternar entre "Perfil" e "Conta".
  - [x] **Aba Perfil:** Formulário para dados pessoais (Nome, Telefone, Peso, Altura, Data de Nasc., Foto).
  - [x] **Aba Conta:** Formulário de segurança (Email, Senha Atual, Nova Senha, Repetir Nova Senha).
- [x] **Backend (Segurança):** Criar endpoint `PUT /api/users/change-password` validando a senha antiga para permitir a troca.

## [ ] Phase 8: Mobile App (React Native / Expo) - Aluno (Adiado)
- [ ] Inicializar projeto Expo e migrar funcionalidades do dashboard do aluno.