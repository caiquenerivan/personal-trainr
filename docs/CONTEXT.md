# Personal Trainr - Contexto e Escopo

## Descrição
Aplicativo SaaS para conectar Usuários (Alunos) a Personal Trainers. O treinador monta rotinas de treino personalizadas, e o aluno consome e marca os treinos como concluídos. 
O ecossistema adota uma abordagem de Monorepo contendo: Backend em Microserviços (Node.js), Frontend Web (React para Trainers) e App Mobile (React Native/Expo para Alunos).

## Escopo do MVP (V1)
Foco em validar o *core business* sem integrações financeiras ou de mensageria complexas.
- Cadastro/login e gestão de perfis diferenciados (Aluno e Treinador).
- Criação de treinos pelo treinador (exercício, séries, repetições, descanso, observações).
- Atribuição de treinos a alunos específicos (divisão AB/ABC, validade).
- Visualização do treino pelo aluno e check-in de conclusão.
- Dashboards básicos de progresso.
- Notificações push básicas (lembrete via Expo).

## Fora do Escopo do MVP (Fases Futuras)
- **Monetização e Split Payments**: Transações financeiras ocorrerão off-app neste primeiro momento. A integração com Stripe/Pagar.me virá em fases de escala.
- **Chat em Tempo Real**: A comunicação direta ocorrerá via WhatsApp. O app focará na entrega e registro do treino.
- Relatórios avançados e gamificação.