# Deploy no Oracle Cloud Free Tier

Roda os 3 backends (auth-service, workout-service, api-gateway) + Postgres numa
única VM sempre ligada, sem custo, sem cold start. O frontend (`apps/web`)
continua onde já está hospedado (Vercel) — não faz parte deste setup.

## 1. Criar a conta e a VM (você faz isso, ninguém mais tem acesso à sua conta)

1. Crie uma conta em https://www.oracle.com/cloud/free/ (pede cartão só pra
   verificação de identidade — o "Always Free" não cobra nada, mas fique de
   olho pra nunca aceitar upgrade pra "Pay As You Go" sem querer).
2. No console, vá em **Compute → Instances → Create Instance**.
3. Nome: `personaltrainr-prod` (ou o que preferir).
4. **Image and shape**: troque a imagem pra `Ubuntu 22.04` (ou mais recente).
   Em "Shape", escolha **Ampere (ARM) → VM.Standard.A1.Flex**, e configure
   **2 OCPUs / 12 GB RAM** (dá pra ir até 4 OCPUs/24GB, mas 2/12 já é de
   sobra pros 3 serviços + Postgres). Se a região não tiver capacidade
   disponível pro shape ARM (acontece, é bem concorrido), tente trocar de
   região ou usar o shape **VM.Standard.E2.1.Micro** (AMD, sempre grátis,
   porém bem menor — 1 OCPU/1GB, pode apertar).
5. Em "Add SSH keys", gere ou cole sua chave pública (`~/.ssh/id_ed25519.pub`).
   Guarde a privada — é a única forma de entrar na VM depois.
6. Crie a instância. Anote o **IP público**.
7. Em **Networking → Virtual Cloud Networks → (sua VCN) → Security Lists**,
   adicione regras de **Ingress** liberando as portas `80` (HTTP) e `443`
   (HTTPS) de `0.0.0.0/0` — por padrão só a porta 22 (SSH) fica aberta.

## 2. Domínio

Caddy (o proxy reverso deste setup) gera HTTPS automático via Let's Encrypt,
mas isso exige um domínio de verdade apontando pro IP público da VM (registro
`A`). Se ainda não tem domínio, é o único gasto real desse caminho (~R$40/ano
num `.com` qualquer) — ou use um subdomínio grátis (ex: DuckDNS) enquanto não
tem receita.

Aponte `api.seudominio.com` → IP público da VM.

## 3. Preparar a VM

SSH na VM (`ssh ubuntu@SEU_IP`) e instale Docker:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

Clone o repositório:

```bash
git clone https://github.com/caiquenerivan/personal-trainr.git
cd personal-trainr/deploy/oracle-vm
```

## 4. Configurar os segredos

Copie os templates e preencha com valores de produção reais — **nunca
reutilize os segredos do `.env` de desenvolvimento local**:

```bash
cp .env.example .env
cp env/auth-service.env.example env/auth-service.env
cp env/workout-service.env.example env/workout-service.env
cp env/api-gateway.env.example env/api-gateway.env
```

Edite os 4 arquivos:
- `.env`: `POSTGRES_PASSWORD` (gere uma senha forte) e `API_DOMAIN`.
- `env/auth-service.env`: use a mesma `POSTGRES_PASSWORD` na `DATABASE_URL`,
  gere `JWT_SECRET`/`INTERNAL_SERVICE_SECRET`/`ASAAS_WEBHOOK_TOKEN` novos
  (ex: `openssl rand -hex 32`), preencha Cloudinary/SMTP/Asaas de produção.
- `env/workout-service.env`: mesma `DATABASE_URL` e o mesmo
  `INTERNAL_SERVICE_SECRET` do auth-service.
- `env/api-gateway.env`: mesmos `JWT_SECRET` e `INTERNAL_SERVICE_SECRET`.

Todo esse diretório de env fica fora do git (veja `.gitignore` local) —
os segredos nunca são commitados.

## 5. Subir

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f
```

O `auth-service` e o `workout-service` rodam `prisma migrate deploy`
automaticamente no boot (já configurado no Dockerfile de cada um).

### Passo manual único no primeiro boot

`auth-service` e `workout-service` compartilham o mesmo banco físico mas têm
históricos de migration separados, e cada um tem uma migration antiga que cria
a tabela `Subscription` (resquício de quando o projeto foi dividido em
serviços). Isso significa que, num banco **novo**, o serviço que migrar por
último vai falhar com `P3009` ao tentar recriar essa tabela. Se
`docker compose ps` mostrar `workout-service` reiniciando em loop, rode:

```bash
docker compose run --rm --entrypoint sh workout-service -c \
  "npx prisma migrate resolve --applied 20260803180500_add_subscription"
docker compose up -d workout-service
```

Isso só é necessário na primeira subida com um banco vazio — depois disso
fica registrado e nunca mais acontece.

Teste:

```bash
curl https://api.seudominio.com/health
```

## 6. Atualizar o frontend e o webhook da Asaas

- No Vercel, aponte `VITE_API_URL` pra `https://api.seudominio.com`.
- No painel da Asaas, atualize a URL do webhook pra
  `https://api.seudominio.com/api/billing/webhook`.

## Como fazer deploy de mudanças novas

```bash
cd personal-trainr
git pull
cd deploy/oracle-vm
docker compose up -d --build
```

## Backup do banco

O Postgres roda num volume Docker (`pgdata`), não em disco solto — mas ainda
assim faça backups periódicos:

```bash
docker exec personaltrainr_db pg_dump -U personaltrainr personaltrainr > backup-$(date +%F).sql
```

Considere agendar isso via `cron` e copiar os `.sql` pra fora da VM (ex: um
bucket gratuito, ou até baixar via `scp` periodicamente).
