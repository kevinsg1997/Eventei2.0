# Eventei

Plataforma para descobrir eventos no Brasil (Ticketmaster e outras fontes) e cadastrar **somente eventos gratuitos**.

## Stack

| Parte | Tecnologia | Deploy alvo |
|-------|------------|-------------|
| Front | Next.js + React (raiz do repo) | Vercel |
| API | Fastify + Better Auth + Prisma (`backend/`) | Railway |
| Banco | PostgreSQL | Railway |

## Estrutura

```
src/         Frontend Next.js (App Router)
backend/     API + auth + providers
legacy/      Protótipo HTML antigo (faculdade)
```

## Desenvolvimento local

### Pré-requisitos

- Node.js 24.x (Vercel / `engines`)
- PostgreSQL

### Banco

```bash
# exemplo local
createdb eventei
```

Configure `backend/.env` (há `.env.example`):

```env
DATABASE_URL="postgresql://eventei:eventei@localhost:5432/eventei?schema=public"
BETTER_AUTH_SECRET="troque-por-um-segredo-longo"
BETTER_AUTH_URL="http://localhost:3000"
WEB_URL="http://localhost:3000"
```

### API

```bash
cd backend
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

API em `http://localhost:4000`.

Contas seed:

- Admin: `admin@eventei.local` / `Admin123!`
- Demo: `demo@eventei.local` / `Demo1234!`

### Web (raiz)

```bash
npm install
cp .env.example .env.local   # se existir; senão crie NEXT_PUBLIC_API_URL
npm run dev
```

Front em `http://localhost:3000`.

### Vercel (preview)

O Next.js está na **raiz** do repositório (compatível com Root Directory padrão).  
Runtime: `engines.node: "24.x"` + `.nvmrc`.  
A API Fastify fica em `backend/` (não usa a pasta `api/` da Vercel).

## OAuth (Google, Facebook, GitHub, Apple)

Preencha as variáveis no `backend/.env`. Sem Client ID/Secret, os botões OAuth ficam no UI mas o provider só autentica depois de configurado. E-mail/senha funciona sem OAuth.

Callbacks Better Auth (ajuste ao domínio público do front/proxy):

- `{BETTER_AUTH_URL}/api/auth/callback/google`
- `{BETTER_AUTH_URL}/api/auth/callback/facebook`
- `{BETTER_AUTH_URL}/api/auth/callback/github`
- `{BETTER_AUTH_URL}/api/auth/callback/apple`

## Providers de eventos (Fase 2)

### Ticketmaster
No portal Ticketmaster você vê **Consumer Key** e **Consumer Secret**:

| Campo no portal | Variável no `backend/.env` / Railway | Uso |
|-----------------|--------------------------------------|-----|
| Consumer Key | `TICKETMASTER_API_KEY` (ou `TICKETMASTER_CONSUMER_KEY`) | Discovery API (`apikey`) — **obrigatória** para inventário BR ao vivo |
| Consumer Secret | `TICKETMASTER_CONSUMER_SECRET` | Reservada (OAuth/commerce). A Discovery pública **não** usa |

Não cole as keys no chat/git. Coloque só no `.env` local e nas env vars do Railway.

Sync manual:

```bash
curl -X POST http://localhost:4000/providers/sync
```

A resposta inclui `summaries` com `mode` (`live` | `stub` | `unavailable`) por fonte.

### Mapa da Cultura
API pública. Em alguns ambientes (Cloudflare) pode bloquear; nesse caso o sync cai para stub se `ALLOW_PROVIDER_STUBS=true`.

### Subcena
API pública por cidade (BH, RJ, SP). Integração live sem chave.

### Sync automático
Defina `PROVIDER_SYNC_INTERVAL_MS=3600000` (1h) na API para sincronizar em background.

## Admin — Pendências

Rota não listada no menu público: `/admin/pendencias`  
Aba **Denúncias** para aceitar/rejeitar. Aceitar com motivo de ingresso pago remove o evento e pode banir o autor.

## Papéis

- `user` — favoritos, calendário, publicar gratuito, denunciar eventos da plataforma
- `admin` — fila de denúncias em Pendências
