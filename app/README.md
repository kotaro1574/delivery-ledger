# Delivery Ledger

配達パートナー向けの収支管理アプリ。Next.js App Router + Hono + Drizzle + Better Auth + Cloudflare D1/R2/OpenNext 構成。

## Local Setup

```bash
npm install
npm run d1:migrate
npm run db:seed
npm run preview
```

Preview は `http://localhost:8787`。

local preview では `wrangler.jsonc` の `env.dev` を使う。

- D1: local `delivery-ledger-db`
- R2: local `delivery-ledger-receipts-dev`
- receipt upload: `/api/receipts/local-upload`

## Verification

```bash
npm run lint
npm run test:run
npx tsc --noEmit
npm run build
```

## Production

本番 deploy 前に `wrangler.jsonc` の placeholder を差し替える。

- `d1_databases[].database_id`
- `R2_BUCKET_NAME`
- `BETTER_AUTH_URL`
- secrets: `BETTER_AUTH_SECRET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_ACCOUNT_ID`

本番では `UPLOAD_MODE=presigned` にして、R2 S3 presigned PUT URL を返す。
