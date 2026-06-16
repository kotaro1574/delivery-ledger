# Delivery Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** fudo-m と同じ Next.js App Router + Hono + Drizzle + Cloudflare/OpenNext 構成で、配達収支台帳 MVP を local D1/R2 で動かす。

**Architecture:** `app/src/app` に画面、`app/server/modules` に Hono API、`app/server/db` に Drizzle schema/client を置く。仕訳生成・保存・集計・receipt upload を module service に分離し、UI は shadcn/ui と prototype CSS token で組む。

**Tech Stack:** Next.js, React, Hono, Drizzle ORM D1, Better Auth, Cloudflare D1/R2/Cron, OpenNext Cloudflare, shadcn/ui, Vitest, Playwright, Biome.

---

### Task 1: Project Scaffold

**Files:**
- Create: `app/package.json`
- Create: `app/next.config.ts`
- Create: `app/open-next.config.ts`
- Create: `app/wrangler.jsonc`
- Create: `app/worker.ts`
- Create: `app/tsconfig.json`
- Create: `app/biome.json`
- Create: `app/vitest.config.ts`
- Create: `app/playwright.config.ts`
- Create: `app/postcss.config.mjs`
- Create: `app/components.json`
- Create: `app/.gitignore`

- [ ] Copy fudo-m compatible config shape and replace names with `delivery-ledger`.
- [ ] Keep `src` alias as `@/*` and server alias as `@server/*`.
- [ ] Configure `env.dev` with local placeholder D1 id and `RECEIPTS` R2 binding.
- [ ] Run `npm install`.

### Task 2: Shared UI Foundation

**Files:**
- Create: `app/src/app/globals.css`
- Create: `app/src/components/ui/*`
- Create: `app/src/lib/utils.ts`
- Create: `app/src/hooks/use-mobile.ts`
- Create: `app/src/components/layout/app-shell.tsx`

- [ ] Copy only the shadcn/ui components needed for this app from fudo-m: `button`, `card`, `input`, `label`, `form`, `tabs`, `badge`, `sonner`, `tooltip`, `separator`.
- [ ] Set CSS variables to prototype-inspired paper/card/ink/income/expense colors.
- [ ] Build a compact top navigation for `台帳`, `入力`, `ログアウト`.

### Task 3: Database and Auth

**Files:**
- Create: `app/server/db/schema.ts`
- Create: `app/server/db/index.ts`
- Create: `app/server/lib/auth.ts`
- Create: `app/server/lib/auth-utils.ts`
- Create: `app/server/lib/errors.ts`
- Create: `app/server/factory.ts`
- Create: `app/server/modules/auth/index.ts`
- Create: `app/src/lib/auth/client.ts`

- [ ] Define Better Auth tables and ledger tables in Drizzle schema.
- [ ] Implement `getDB()` with `getCloudflareContext({ async: true })`.
- [ ] Implement `createAuth()` with Drizzle adapter and email/password.
- [ ] Implement `requireAuth()` that throws 401 when session is absent.
- [ ] Mount Better Auth at `/api/auth/*` in Hono.
- [ ] Redirect unauthenticated dashboard requests from the dashboard layout rather than global middleware/proxy.

### Task 4: Journal Domain with TDD

**Files:**
- Create: `app/server/modules/entries/journal.test.ts`
- Create: `app/server/modules/entries/journal.ts`
- Create: `app/server/lib/accounts.ts`

- [ ] Write failing tests for income lines, 100% expense lines, 70% communication split, 80% vehicle split, and debit/credit balance.
- [ ] Implement journal builder using account codes from constants.
- [ ] Run `npm run test:run -- server/modules/entries/journal.test.ts`.

### Task 5: Entries API with TDD

**Files:**
- Create: `app/server/modules/entries/model.ts`
- Create: `app/server/modules/entries/service.ts`
- Create: `app/server/modules/entries/index.ts`
- Modify: `app/server/index.ts`

- [ ] Write service tests for validation-facing behavior and daily stats upsert statement shape where practical.
- [ ] Implement `POST /api/entries` and `GET /api/entries?month=YYYY-MM`.
- [ ] Ensure income is grouped as one row per day and expenses are listed by journal line.

### Task 6: Summary API with TDD

**Files:**
- Create: `app/server/modules/summary/model.ts`
- Create: `app/server/modules/summary/service.ts`
- Create: `app/server/modules/summary/index.ts`
- Modify: `app/server/index.ts`

- [ ] Write tests for revenue, expense, profit, category grouping, wage per hour, and per delivery calculations.
- [ ] Implement monthly summary queries filtered by `userId` and month.

### Task 7: Receipts API

**Files:**
- Create: `app/server/modules/receipts/model.ts`
- Create: `app/server/modules/receipts/service.ts`
- Create: `app/server/modules/receipts/index.ts`
- Create: `app/server/lib/r2.ts`
- Create: `app/server/lib/r2-presign.ts`
- Modify: `app/server/index.ts`

- [ ] Write tests for key generation and local upload response.
- [ ] Implement `POST /api/receipts/upload-url`.
- [ ] Implement local `PUT /api/receipts/local-upload/:encodedKey`.
- [ ] Implement production presigned URL with `aws4fetch`.

### Task 8: Seed and Migrations

**Files:**
- Create: `app/scripts/seed.ts`
- Create: `app/drizzle/migrations/0000_initial.sql`
- Modify: `app/package.json`

- [ ] Add accounts seed for all design-doc accounts.
- [ ] Add default category ratios for vehicle and communication.
- [ ] Add scripts for local migration and seed.

### Task 9: Auth Pages

**Files:**
- Create: `app/src/app/(auth)/layout.tsx`
- Create: `app/src/app/(auth)/login/page.tsx`
- Create: `app/src/app/(auth)/signup/page.tsx`
- Create: `app/src/lib/validation/auth.ts`

- [ ] Build shadcn card forms for signup/login.
- [ ] Use Better Auth React client.
- [ ] Redirect authenticated users into `/`.

### Task 10: Ledger UI

**Files:**
- Create: `app/src/app/(dashboard)/layout.tsx`
- Create: `app/src/app/(dashboard)/page.tsx`
- Create: `app/src/features/ledger/components/ledger-dashboard.tsx`
- Create: `app/src/lib/api/client.ts`

- [ ] Build month navigation.
- [ ] Render summary cells, category bars, metrics, and transaction list.
- [ ] Use prototype colors and compact mobile-first layout.

### Task 11: Input UI

**Files:**
- Create: `app/src/app/(dashboard)/input/page.tsx`
- Create: `app/src/features/entries/components/entry-input-form.tsx`
- Create: `app/src/features/entries/utils/journal-preview.ts`

- [ ] Build income/expense tabs, presets, amount field, category chips, stats preview, receipt upload, memo, journal preview, save button, recent input list.
- [ ] Submit to Hono API.
- [ ] Upload receipts to local/prod upload URL before entry save.

### Task 12: Final Verification

**Files:**
- Modify as needed.

- [ ] Run `npm run lint`.
- [ ] Run `npm run test:run`.
- [ ] Run `npm run build`.
- [ ] Run local D1 migrations.
- [ ] Run seed.
- [ ] Run `npm run preview`.
- [ ] Use Browser/Playwright to confirm signup/login/input/dashboard.
