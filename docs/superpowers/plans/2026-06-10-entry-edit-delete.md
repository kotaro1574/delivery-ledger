# Entry Edit Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 入力済みの収入・経費を取引1件単位で編集・削除できるようにする。

**Architecture:** `journal_entries` と `journal_lines` は会計仕訳として残し、新しい `entry_details` テーブルで入力フォーム用の復元データを保持する。作成・編集では仕訳行と詳細行を同時に作り直し、削除では詳細行・仕訳行・取引本体を消す。月次集計の件数・オンライン時間は `entry_details` 優先、legacy の `daily_stats` は詳細行がない日だけfallbackする。

**Tech Stack:** Next.js App Router, Hono, Drizzle ORM, Cloudflare D1, React, Vitest, Testing Library, Playwright.

---

### Task 1: DB Schema And Migration

**Files:**
- Modify: `app/server/db/schema.ts`
- Create: `app/drizzle/migrations/0001_entry_details.sql`
- Test: `app/server/modules/entries/service.test.ts`

- [ ] **Step 1: Write failing service tests**

Add tests that create two income entries on the same date, list them as two items, update one amount and minutes, then delete the other.

- [ ] **Step 2: Add `entry_details` schema**

Create `entryDetails` with `entryId`, `kind`, `amount`, `categoryCode`, `deliveries`, `onlineMinutes`, and `receiptKey`.

- [ ] **Step 3: Add migration**

Create table and backfill existing income/expense rows from `journal_entries` and `journal_lines`. Existing daily stats stay as legacy fallback only.

### Task 2: Entries API

**Files:**
- Modify: `app/server/modules/entries/model.ts`
- Modify: `app/server/modules/entries/service.ts`
- Modify: `app/server/modules/entries/index.ts`

- [ ] **Step 1: Add update/delete models**

Define `UpdateRequest`, `UpdateResponse`, and `DeleteResponse`.

- [ ] **Step 2: Implement service methods**

Add `update(userId, entryId, input)` and `remove(userId, entryId)`. Rebuild journal lines on update and delete rows on remove.

- [ ] **Step 3: Add Hono routes**

Add `PATCH /api/entries/:id` and `DELETE /api/entries/:id`.

### Task 3: Dashboard UI

**Files:**
- Modify: `app/src/features/ledger/components/ledger-dashboard.tsx`
- Test: `app/src/features/ledger/components/ledger-dashboard.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Test that edit opens a dialog with existing values, save sends PATCH, delete sends DELETE after confirmation.

- [ ] **Step 2: Implement edit dialog**

Use existing shadcn-style controls. Show income fields for income and category/receipt fields for expense.

- [ ] **Step 3: Implement delete confirmation**

Use an inline confirm state and refresh after success.

### Task 4: Verification

- [ ] Run targeted tests.
- [ ] Run full `test:run`, `lint`, `tsc --noEmit`, and `build`.
- [ ] Apply local D1 migration.
- [ ] Restart `npm run preview`.
- [ ] Verify with Playwright: create income, edit amount/minutes, delete entry, confirm dashboard totals update.
