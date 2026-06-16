# Delivery Ledger Design

## Goal

Uber Eats 配達パートナー向けに、収入・経費・稼働メモを軽く入力し、複式簿記の仕訳、月次一覧、月次集計、レシート保存を Cloudflare local-first で動かす。

## Reference App

`/Users/sugitakoutarou/TSUQREA./fudo-m/app` の構成を参考にする。

- Next.js 本体は `app/src/app` に置く。
- Hono backend は `app/server` に置く。
- API は `app/server/modules/<domain>/index.ts`, `service.ts`, `model.ts` に分ける。
- `app/server/index.ts` で `.basePath("/api")` して module を route 登録する。
- `app/server/factory.ts` で共通 middleware と error handler を持つ。
- Drizzle D1 client は `app/server/db/index.ts` の `getDB()` 経由で取得する。
- Better Auth は `app/server/modules/auth` で Hono に載せる。
- UI は `shadcn/ui` の component 体系を使う。

## Application Shape

`/` は認証後の台帳 dashboard、`/input` は入力画面にする。`/login` と `/signup` は Better Auth email/password の画面にする。OpenNext Cloudflare preview で Node.js proxy/middleware が未対応のため、未ログイン redirect は dashboard layout で行い、API は `requireAuth()` で 401 を返す。

UI は添付 prototype の配色・レイアウト・操作感を踏襲する。紙色背景、クリーム色 card、収入の緑、経費のクレイ色、月送り、chip category、仕訳 preview、最近の入力を残す。`delivery-ledger.jsx` の強い pink 背景は prototype 間で一貫しないため、入力画面と同じ paper color を採用する。

## Data Model

Drizzle schema は Better Auth tables と ledger tables を同じ schema file に置く。

- `user`, `session`, `account`, `verification`
- `accounts`
- `journal_entries`
- `journal_lines`
- `category_ratios`
- `fixed_assets`
- `daily_stats`

`journal_entries.id` は UUID text とする。仕訳保存は app 側で ID を作り、header と lines と daily stats upsert を `db.batch()` でまとめる。

## Server Modules

- `auth`: Better Auth handler
- `entries`: `POST /api/entries`, `GET /api/entries`
- `summary`: `GET /api/summary`
- `receipts`: `POST /api/receipts/upload-url`, `PUT /api/receipts/local-upload/:key`
- `health-check`: local preview 確認用

`entries` module は validation だけを受け持ち、仕訳生成・保存は `journal` service に寄せる。集計 SQL は `summary` service に寄せる。

## Receipt Upload

local preview では `upload-url` が app 内の local upload endpoint を返し、browser がそこに `PUT` する。endpoint は `env.RECEIPTS.put()` で local R2 に保存する。

production では `aws4fetch` で R2 S3 presigned PUT URL を返す。`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `R2_BUCKET_NAME` が揃わない場合は server error にする。

## Cloudflare

`wrangler.jsonc` は fudo-m と同じ OpenNext layout を使う。

- `main: "worker.ts"`
- `.open-next/assets` を assets binding
- `DB` D1 binding
- `RECEIPTS` R2 binding
- `env.dev` は local-first placeholder DB id
- `nodejs_compat`
- Cron trigger は仕様通り置く

## Verification

Vitest で仕訳生成、家事按分、集計、API 401、local R2 upload response を確認する。Playwright は signup/login/input/dashboard の主要 flow を確認する。最後に `npm run lint`, `npm run test:run`, `npm run build`, `npm run preview` を確認する。

## Open Questions

Cloudflare 本番の D1 database id と R2 credentials は未確定。local-first scaffold では placeholder を置き、deploy 前に差し替える。
