# Checklist de deploy

## Variáveis de ambiente
Cada serviço tem um `.env.example` — copie e preencha com valores reais de produção.
Nunca reutilize os valores do `.env` de desenvolvimento local (gere segredos novos).

- `apps/auth-service/.env.example`
- `apps/workout-service/.env.example`
- `apps/api-gateway/.env.example`
- `apps/web/.env.example`

## Banco de dados
Antes de subir `auth-service` e `workout-service` em produção pela primeira vez, rode em cada um:

```bash
cd apps/auth-service && npx prisma migrate deploy
cd apps/workout-service && npx prisma migrate deploy
```

Isso deve rodar a cada deploy que inclua uma migration nova (ex: como um passo de build/release na plataforma escolhida).

## CORS
Configure `CORS_ORIGIN` em `auth-service`, `workout-service` e `api-gateway` com o domínio real do frontend
(ex: `https://app.seudominio.com`). Sem isso o navegador bloqueia as chamadas da API.

## Frontend
Configure `VITE_API_URL` apontando para a URL pública do `api-gateway` antes de buildar (`npm run build`).

## Asaas
- Troque `ASAAS_API_URL`/`ASAAS_API_KEY` de sandbox para produção quando a conta for aprovada.
- Configure a URL do webhook (`https://SEU_DOMINIO/api/billing/webhook`) no painel da Asaas, usando o mesmo
  valor de `ASAAS_WEBHOOK_TOKEN` do `.env` do `auth-service`.

## Depois do primeiro deploy
- Confirme que `/health` responde em todos os serviços.
- Teste cadastro, login e o fluxo de assinatura ponta a ponta em produção antes de divulgar.
