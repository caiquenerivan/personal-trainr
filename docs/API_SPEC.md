# Especificação da API (REST)

## API Gateway (`localhost:8000`)
Centraliza e roteia as requisições para os serviços internos.

### Auth & Users (Roteia para `auth-service`)
- `POST /api/auth/register` -> Cadastro de Trainer ou Aluno
- `POST /api/auth/login` -> Autenticação (Retorna JWT e Refresh Token)
- `GET /api/users/profile` -> Retorna dados do perfil do usuário logado

### Workouts & Routines (Roteia para `workout-service`)
*Requer Header: `Authorization: Bearer <token>`*

**Trainer (Web):**
- `POST /api/routines` -> Cria treino e atribui a um aluno (Payload: alunoId, tipo AB/ABC, validade)
- `GET /api/trainers/dashboard` -> Retorna progresso básico dos alunos vinculados

**Aluno (Mobile):**
- `GET /api/my-routine` -> Retorna a rotina ativa atual
- `POST /api/workout/complete` -> Marca um exercício/dia de treino como concluído
- `GET /api/students/dashboard` -> Retorna histórico de treinos concluídos