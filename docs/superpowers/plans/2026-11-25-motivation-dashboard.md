# 稼ぐ手応えダッシュボード Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 累計売上で上がるレベル＋進化キャラ、月間売上目標、収入保存直後のお祝いを台帳トップに追加する。

**Architecture:** レベル・ペース計算は `src/features/motivation/utils` の純粋関数。累計売上と目標は `SummaryService.monthly` のレスポンスに相乗りさせ、目標の書き込みは新 Hono モジュール `goals`。UI は `src/features/motivation/components` に置き、`LedgerDashboard` の先頭に差し込む。

**Tech Stack:** Next.js App Router / Hono / Drizzle (D1) / Tailwind v4 / shadcn Popover / vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-11-25-motivation-dashboard-design.md`

## Global Constraints
- `any` 禁止、説明コメントなし、`useEffect` は使わない（アニメは CSS のみ）
- 既存の紙・ベージュ基調を維持。追加色は金系アクセント 1 色 `--ledger-gold: #c08a2e` のみ
- アニメーションは `motion-safe:` でのみ有効（`prefers-reduced-motion` で無効）
- レベル曲線: Lv n→n+1 の必要額 `30000 + 5000 * (n - 1)`、Lv1 スタート、上限なし
- 称号: ルーキー(1–9) / レギュラー(10–19) / エース(20–29) / ベテラン(30–39) / レジェンド(40+)
- マイグレーションは手書き SQL（既存 0000/0001 と同じ形式）

## Review Focus
- 目標未設定の月 (`goal: null`) → 「今月の目標を決めよう」ボタン、リングは出さない
- 過去月・未来月の表示 → 1日ペースを出さず、過去月は「達成 / 未達」のみ
- 目標超過 → 達成率は 100% で頭打ち表示、超過額を「+¥x オーバー」
- `?gained=` が数値でない／0 以下／累計売上より大きい → バナーを出さない
- 累計売上ちょうどレベル境界（例 ¥30,000）→ Lv2、進捗 0%

---

### Task 1: レベル・ペース計算の純粋関数

**Files:**
- Create: `src/features/motivation/utils/level.ts`, `src/features/motivation/utils/goal-progress.ts`
- Test: `src/features/motivation/utils/level.test.ts`, `src/features/motivation/utils/goal-progress.test.ts`

**Interfaces:**
- Produces:
  - `type RiderStage = "rookie" | "regular" | "ace" | "veteran" | "legend"`
  - `levelFromRevenue(total: number): LevelInfo` where `LevelInfo = { level: number; title: string; stage: RiderStage; currentLevelStart: number; nextLevelAt: number; progress: number /* 0–1 */ ; remaining: number }`
  - `goalProgress(input: { month: string; revenue: number; goal: number | null; today: Date }): GoalProgress | null` where `GoalProgress = { goal: number; rate: number /* 0–1, capped */; remaining: number; overAmount: number; achieved: boolean; timing: "current" | "past" | "future"; daysLeft: number | null; dailyPace: number | null }`

- [ ] **Step 1: Write failing tests**
  - `levelFromRevenue(0)` → `{ level: 1, title: "ルーキー", stage: "rookie", currentLevelStart: 0, nextLevelAt: 30000, progress: 0, remaining: 30000 }`
  - `levelFromRevenue(30000)` → level 2, progress 0, nextLevelAt 65000
  - `levelFromRevenue(450000)` → level 10, title "レギュラー", stage "regular"
  - `levelFromRevenue(1425000)` → level 20, stage "ace"; `levelFromRevenue(2900000)` → level 30, stage "veteran"
  - Lv40 到達額（累計 `39*30000 + 5000*741 = 4875000`）→ level 40, stage "legend"
  - `goalProgress({ month: "2026-11", revenue: 186000, goal: 300000, today: new Date(2026, 10, 25) })` → rate 0.62, remaining 114000, daysLeft 6, dailyPace 19000, timing "current"
  - 超過: revenue 320000 / goal 300000 → rate 1, overAmount 20000, achieved true, remaining 0
  - 過去月 → timing "past", daysLeft null, dailyPace null
  - goal null → `null`
- [ ] **Step 2:** `npx vitest run src/features/motivation` → FAIL (module not found)
- [ ] **Step 3:** 実装。`dailyPace = Math.ceil(remaining / daysLeft)`、daysLeft は今日を含む月末まで
- [ ] **Step 4:** 同コマンド → PASS
- [ ] **Step 5:** Commit `feat: add level and goal progress calculations`

### Task 2: monthly_goals テーブルと goals API、summary 拡張

**Files:**
- Create: `drizzle/migrations/0002_monthly_goals.sql`, `server/modules/goals/{index,model,service}.ts`
- Modify: `server/db/schema.ts`, `server/index.ts`, `server/modules/summary/{model,service}.ts`
- Test: `server/modules/goals/model.test.ts`

**Interfaces:**
- Produces:
  - table `monthly_goals(id INTEGER PK AUTOINCREMENT, user_id TEXT NOT NULL, month TEXT NOT NULL, target_amount INTEGER NOT NULL CHECK (target_amount > 0), UNIQUE(user_id, month))`, drizzle export `monthlyGoals`
  - `GoalsModel.MonthParam = z.object({ month: /^\d{4}-\d{2}$/ })`, `GoalsModel.UpsertRequest = z.object({ targetAmount: z.number().int().positive().max(100_000_000) })`
  - `PUT /api/goals/:month` → `{ month, targetAmount }`; `DELETE /api/goals/:month` → `{ month }`
  - `SummaryModel.Response` に `lifetimeRevenue: number`, `goal: number | null` 追加

- [ ] **Step 1:** model のバリデーションテスト（0・負数・小数・"2026-1" を reject）を書く → FAIL
- [ ] **Step 2:** context7 で drizzle `onConflictDoUpdate` (sqlite) を確認してから service 実装。schema・migration・route 登録
- [ ] **Step 3:** `SummaryService.monthly` に累計売上（月条件なし revenue 集計）と当月目標の取得を `Promise.all` に追加
- [ ] **Step 4:** `npx vitest run server && npx tsc --noEmit` → PASS。既存 summary/ledger テストのフィクスチャに新フィールドを追加
- [ ] **Step 5:** `npm run d1:migrate` でローカル適用確認、Commit `feat: store monthly revenue goals`

### Task 3: 進化キャラとステータスパネル

**Files:**
- Create: `src/features/motivation/components/rider-character.tsx`, `level-card.tsx`, `goal-card.tsx`, `goal-editor.tsx`
- Modify: `src/features/ledger/components/ledger-dashboard.tsx`, `src/app/globals.css`
- Test: `src/features/motivation/components/status-panel.test.tsx`

**Interfaces:**
- Consumes: Task 1 の `levelFromRevenue`, `goalProgress`; Task 2 の `summary.lifetimeRevenue`, `summary.goal`
- Produces: `<RiderCharacter stage={RiderStage} bounce?: boolean />`, `<LevelCard lifetimeRevenue={number} highlightFrom?: number />`, `<GoalCard month={string} revenue={number} goal={number | null} />`

- [ ] **Step 1: Write failing tests**
  - lifetimeRevenue 612400 で「Lv.12」「レギュラー」「次のLvまで」が出る
  - goal null で「今月の目標を決めよう」ボタン
  - 当月 goal 300000 / revenue 186000 で「62%」「1日 ¥19,000 ペース」
  - 過去月で達成時「目標達成！」、ペース表示なし
- [ ] **Step 2:** FAIL 確認
- [ ] **Step 3:** 実装。キャラは stage ごとの inline SVG（徒歩バッグ / 自転車 / 電動アシスト＋スピード線 / 原付 / バイク＋金オーラ）、`role="img"` と `aria-label`。GoalEditor は既存 Popover＋金額入力、保存で `PUT /api/goals/:month` → `router.refresh()`、空で保存すると DELETE
- [ ] **Step 4:** PASS 確認、`npm run lint`
- [ ] **Step 5:** Commit `feat: show level, rider character and monthly goal`

### Task 4: 収入保存直後のお祝い

**Files:**
- Create: `src/features/motivation/components/celebration-banner.tsx`
- Modify: `src/features/entries/components/entry-input-form.tsx`（収入保存後 `router.push(\`/?gained=${amount}\`)`）, `src/app/(dashboard)/page.tsx`（`gained` を parse して渡す）, `ledger-dashboard.tsx`
- Test: `celebration-banner.test.tsx`, 既存 `entry-input-form.test.tsx` の遷移先アサーション更新

**Interfaces:**
- Consumes: `levelFromRevenue`
- Produces: `<CelebrationBanner gained={number} lifetimeRevenue={number} />`

- [ ] **Step 1: Write failing tests**
  - gained 12000 / lifetime 612400 → 「+¥12,000 ゲット！」、レベル変化なしなら LEVEL UP なし
  - gained 20000 / lifetime 455000 → 「LEVEL UP!」「Lv.9 → Lv.10」と称号変化の「進化！」
  - 閉じるボタンで `router.replace("/?month=…")` 相当が呼ばれる
  - 入力フォーム: 収入保存で `/?gained=12000`、経費保存は `/` のまま
- [ ] **Step 2:** FAIL 確認
- [ ] **Step 3:** 実装。page.tsx で `gained` が正の整数かつ `<= lifetimeRevenue` のときだけ渡す。LevelCard の `highlightFrom` に `lifetimeRevenue - gained` を渡してバーを伸ばすアニメ、キャラは `bounce`
- [ ] **Step 4:** `npm run test:run && npx tsc --noEmit && npm run lint` → PASS
- [ ] **Step 5:** Commit `feat: celebrate income entries with level up banner`

### Task 5: ブラウザ確認

- [ ] `npm run preview` で 375px 幅とデスクトップを確認：目標設定→達成率、収入入力→お祝い→レベルアップ、各ステージのキャラ表示
