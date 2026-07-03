# Engenharia e Arquitetura do Sistema

## Estrutura do Repositório (Monorepo)
O projeto utilizará uma estrutura de Monorepo (utilizando npm workspaces, yarn workspaces ou Turborepo) contendo:
- `apps/api-gateway`: BFF em Node.js/Express.
- `apps/auth-service`: Microserviço Node.js + TypeScript + Prisma + PostgreSQL.
- `apps/workout-service`: Microserviço Node.js + TypeScript + Prisma + PostgreSQL.
- `apps/web`: Frontend em React + TypeScript + TailwindCSS.
- `apps/mobile`: App em React Native (Expo) + TypeScript.

## Comunicação
- **Padrão Síncrono (REST)**: Toda comunicação inter-serviços no MVP será via chamadas HTTP/REST. Sem filas assíncronas (RabbitMQ/Redis) para manter a agilidade inicial.

## Infraestrutura
- **Local (Vibecoding / Dev)**: Docker Compose na raiz do projeto orquestrando instâncias de PostgreSQL e os serviços Node.
- **Produção (AWS)**: 
  - EC2/ECS para os microserviços Node.js.
  - RDS para os bancos de dados PostgreSQL.
  - S3 para armazenamento de imagens/vídeos.
  - Vercel ou AWS Amplify para o Frontend Web.