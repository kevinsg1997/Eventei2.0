# Eventei

Plataforma para descobrir eventos no Brasil (Ticketmaster e outras fontes) e cadastrar **somente eventos gratuitos**.

## Stack (Fase 1)

| Parte | Tecnologia | Deploy alvo |
|-------|------------|-------------|
| Front | Next.js + React | Vercel |
| API | Fastify + Better Auth + Prisma | Railway |
| Banco | PostgreSQL | Railway |

## Estrutura

```
api/       API + auth + providers (stubs)
web/       Frontend Next.js
legacy/    Protótipo HTML antigo (faculdade)
```

## Desenvolvimento local

### Pré-requisitos

- Node.js 20+
- PostgreSQL

### Banco

```bash
# exemplo local
createdb eventei
```

Configure `api/.env` (há `.env.example`):

```env
DATABASE_URL="postgresql://eventei:eventei@localhost:5432/eventei?schema=public"
BETTER_AUTH_SECRET="troque-por-um-segredo-longo"
BETTER_AUTH_URL="http://localhost:4000"
WEB_URL="http://localhost:3000"
```

### API

```bash
cd api
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

API em `http://localhost:4000`.

Contas seed:

- Admin: `admin@eventei.local` / `Admin123!`
- Demo: `demo@eventei.local` / `Demo1234!`

### Web

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Front em `http://localhost:3000`.

## OAuth (Google, Facebook, GitHub, Apple)

Preencha as variáveis no `api/.env`. Sem Client ID/Secret, os botões OAuth ficam no UI mas o provider só autentica depois de configurado. E-mail/senha funciona sem OAuth.

Callbacks Better Auth (ajuste ao domínio da API):

- `{BETTER_AUTH_URL}/api/auth/callback/google`
- `{BETTER_AUTH_URL}/api/auth/callback/facebook`
- `{BETTER_AUTH_URL}/api/auth/callback/github`
- `{BETTER_AUTH_URL}/api/auth/callback/apple`

## Ticketmaster

`TICKETMASTER_API_KEY` pode ficar vazia na Fase 1. Os providers usam stubs até a Fase 2.

## Admin — Pendências

Rota não listada no menu público: `/admin/pendencias`  
Aba **Denúncias** para aceitar/rejeitar. Aceitar com motivo de ingresso pago remove o evento e pode banir o autor.

## Papéis

- `user` — favoritos, calendário, publicar gratuito, denunciar eventos da plataforma
- `admin` — fila de denúncias em Pendências
