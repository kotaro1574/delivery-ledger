# 月次の稼働日数・稼働時間表示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 月次ダッシュボードに稼働日数（収入記録がある日の distinct カウント）と稼働時間（既存 onlineHours）のカードを表示する。

**Architecture:** server 側 `SummaryService.monthly` で既に取得済みの収入エントリ日付リストと legacy `daily_stats` 行から distinct 日付を数え、`metrics.workDays` として返す。新規 DB クエリなし。UI は指標カードセクションを 2×2 の 4 枚構成にする。

**Tech Stack:** Next.js App Router / Hono / Drizzle (D1) / Zod / Vitest / Testing Library

**Spec:** `docs/superpowers/specs/2026-07-18-monthly-work-stats-design.md`

## Global Constraints

- コマンドはすべて `app/` ディレクトリで実行する
- コード内に説明コメントを書かない
- `any` 禁止
- UI 文言は日本語（「稼働日数」「稼働時間」）
- lint は `npm run lint`（biome）

---

### Task 1: server — metrics に workDays を追加

**Files:**
- Modify: `server/modules/summary/metrics.ts`
- Modify: `server/modules/summary/model.ts`
- Modify: `server/modules/summary/service.ts:118-160`
- Test: `server/modules/summary/metrics.test.ts`
- Test: `server/modules/summary/model.test.ts`
- Modify: `src/features/ledger/components/ledger-dashboard.test.tsx:12-24`（fixture の typecheck 維持のみ）

**Interfaces:**
- Produces: `MetricInput = { revenue: number; deliveries: number; onlineMinutes: number; workDays: number }`、`SummaryMetrics = { wagePerHour: number; perDelivery: number; deliveries: number; onlineHours: number; workDays: number }`、`SummaryModel.Response` の `metrics` に `workDays: z.number()`。Task 2 は `summary.metrics.workDays` を参照する。

- [ ] **Step 1: metrics.test.ts の既存 2 ケースに workDays を追加（failing test）**

`server/modules/summary/metrics.test.ts` を次の内容に書き換える:

```ts
import { describe, expect, it } from "vitest";
import { calculateMetrics } from "./metrics";

describe("calculateMetrics", () => {
  it("売上、分、件数から時給と1件単価を計算する", () => {
    expect(
      calculateMetrics({
        revenue: 12000,
        deliveries: 24,
        onlineMinutes: 360,
        workDays: 5,
      }),
    ).toEqual({
      wagePerHour: 2000,
      perDelivery: 500,
      deliveries: 24,
      onlineHours: 6,
      workDays: 5,
    });
  });

  it("分や件数がない場合は0を返す", () => {
    expect(
      calculateMetrics({
        revenue: 12000,
        deliveries: 0,
        onlineMinutes: 0,
        workDays: 0,
      }),
    ).toEqual({
      wagePerHour: 0,
      perDelivery: 0,
      deliveries: 0,
      onlineHours: 0,
      workDays: 0,
    });
  });
});
```

- [ ] **Step 2: テストが落ちることを確認**

Run: `npm run test:run -- server/modules/summary/metrics.test.ts`
Expected: FAIL（返り値に `workDays` が含まれず toEqual 不一致）

- [ ] **Step 3: metrics.ts に workDays をパススルー実装**

`server/modules/summary/metrics.ts` を次の内容に書き換える:

```ts
export type MetricInput = {
  revenue: number;
  deliveries: number;
  onlineMinutes: number;
  workDays: number;
};

export type SummaryMetrics = {
  wagePerHour: number;
  perDelivery: number;
  deliveries: number;
  onlineHours: number;
  workDays: number;
};

export function calculateMetrics(input: MetricInput): SummaryMetrics {
  const onlineHours = Math.round((input.onlineMinutes / 60) * 10) / 10;

  return {
    wagePerHour:
      input.onlineMinutes > 0
        ? Math.round(input.revenue / (input.onlineMinutes / 60))
        : 0,
    perDelivery:
      input.deliveries > 0 ? Math.round(input.revenue / input.deliveries) : 0,
    deliveries: input.deliveries,
    onlineHours,
    workDays: input.workDays,
  };
}
```

- [ ] **Step 4: metrics テストが通ることを確認**

Run: `npm run test:run -- server/modules/summary/metrics.test.ts`
Expected: PASS（2 tests）

- [ ] **Step 5: model.test.ts に workDays を追加（failing test）**

`server/modules/summary/model.test.ts` の「事業分経費と支払総額を区別して返す」ケースを次に書き換える（`parse` 入力と期待値の両方の `metrics` に `workDays: 0` を追加。「年次集計を返す」ケースは変更しない）:

```ts
  it("事業分経費と支払総額を区別して返す", () => {
    expect(
      SummaryModel.Response.parse({
        revenue: 65559,
        expense: 564,
        paidExpense: 705,
        profit: 64995,
        byCategory: [{ code: "601", name: "車両費", amount: 564 }],
        metrics: {
          wagePerHour: 0,
          perDelivery: 0,
          deliveries: 0,
          onlineHours: 0,
          workDays: 0,
        },
      }),
    ).toEqual({
      revenue: 65559,
      expense: 564,
      paidExpense: 705,
      profit: 64995,
      byCategory: [{ code: "601", name: "車両費", amount: 564 }],
      metrics: {
        wagePerHour: 0,
        perDelivery: 0,
        deliveries: 0,
        onlineHours: 0,
        workDays: 0,
      },
    });
  });
```

- [ ] **Step 6: テストが落ちることを確認**

Run: `npm run test:run -- server/modules/summary/model.test.ts`
Expected: FAIL（zod が未定義キー `workDays` を strip するため toEqual 不一致）

- [ ] **Step 7: model.ts の metrics スキーマに workDays を追加**

`server/modules/summary/model.ts` の `Response` 内 `metrics` を次に変更する:

```ts
    metrics: z.object({
      wagePerHour: z.number(),
      perDelivery: z.number(),
      deliveries: z.number(),
      onlineHours: z.number(),
      workDays: z.number(),
    }),
```

- [ ] **Step 8: model テストが通ることを確認**

Run: `npm run test:run -- server/modules/summary/model.test.ts`
Expected: PASS（2 tests）

- [ ] **Step 9: service.ts で workDays を計算して渡す**

`server/modules/summary/service.ts` の `monthly` 内、`legacyStats` の算出部分（現在 135-143 行目）と `calculateMetrics` 呼び出し（155-159 行目）を次に変更する。legacy 行の `!detailDatesWithStats.has(...)` フィルタを変数 `legacyRows` に抽出し、稼働時間の合算（stats 有無を問わない、従来どおり）と稼働日カウント（stats が正の行のみ）の両方で使う:

```ts
    const legacyRows = legacyStatsRows.filter(
      (row) => !detailDatesWithStats.has(row.date),
    );
    const legacyStats = legacyRows.reduce(
      (total, row) => ({
        deliveries: total.deliveries + (row.deliveries ?? 0),
        onlineMinutes: total.onlineMinutes + (row.onlineMinutes ?? 0),
      }),
      { deliveries: 0, onlineMinutes: 0 },
    );
    const stats = {
      deliveries: detailStats.deliveries + legacyStats.deliveries,
      onlineMinutes: detailStats.onlineMinutes + legacyStats.onlineMinutes,
    };
    const workDays = new Set([
      ...detailStatsRows.map((row) => row.date),
      ...legacyRows
        .filter(
          (row) => (row.deliveries ?? 0) > 0 || (row.onlineMinutes ?? 0) > 0,
        )
        .map((row) => row.date),
    ]).size;
```

`calculateMetrics` 呼び出しを次に変更する:

```ts
      metrics: calculateMetrics({
        revenue,
        deliveries: stats.deliveries ?? 0,
        onlineMinutes: stats.onlineMinutes ?? 0,
        workDays,
      }),
```

- [ ] **Step 10: ledger-dashboard.test.tsx の fixture に workDays を追加（typecheck 維持）**

`src/features/ledger/components/ledger-dashboard.test.tsx` の `summary` fixture の `metrics` を次に変更する（表示テストの追加は Task 2）:

```ts
  metrics: {
    wagePerHour: 1822,
    perDelivery: 1025,
    deliveries: 8,
    onlineHours: 4.5,
    workDays: 12,
  },
```

- [ ] **Step 11: typecheck と全テストが通ることを確認**

Run: `npx tsc --noEmit && npm run test:run`
Expected: 両方 PASS（エラー 0）

- [ ] **Step 12: Commit**

```bash
git add server/modules/summary/metrics.ts server/modules/summary/metrics.test.ts server/modules/summary/model.ts server/modules/summary/model.test.ts server/modules/summary/service.ts src/features/ledger/components/ledger-dashboard.test.tsx
git commit -m "Add workDays to monthly summary metrics"
```

---

### Task 2: UI — 稼働日数・稼働時間カードを追加

**Files:**
- Modify: `src/features/ledger/components/ledger-dashboard.tsx:335-358`（指標カードセクション）
- Test: `src/features/ledger/components/ledger-dashboard.test.tsx`

**Interfaces:**
- Consumes: `summary.metrics.workDays: number`（Task 1）、`summary.metrics.onlineHours: number`（既存）

- [ ] **Step 1: 表示テストを追加（failing test）**

`src/features/ledger/components/ledger-dashboard.test.tsx` の `describe("LedgerDashboard", ...)` 内に次のテストを追加する（fixture は Task 1 で `workDays: 12` / `onlineHours: 4.5` 済み）:

```tsx
  it("稼働日数と稼働時間を表示する", () => {
    render(<LedgerDashboard entries={[]} month="2026-06" summary={summary} />);

    expect(screen.getByText("稼働日数")).toBeInTheDocument();
    expect(screen.getByText("12日")).toBeInTheDocument();
    expect(screen.getByText("稼働時間")).toBeInTheDocument();
    expect(screen.getByText("4.5時間")).toBeInTheDocument();
    expect(screen.queryByText("オンライン 4.5時間")).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: テストが落ちることを確認**

Run: `npm run test:run -- src/features/ledger/components/ledger-dashboard.test.tsx`
Expected: FAIL（`稼働日数` が見つからない）

- [ ] **Step 3: カードセクションを 2×2 に変更**

`src/features/ledger/components/ledger-dashboard.tsx` の指標カードセクション（`<section className="grid gap-3 sm:grid-cols-2">`）を次に書き換える。「平均時給」カードのサブテキスト「オンライン X時間」は削除し、「稼働日数」「稼働時間」カードを追加する:

```tsx
      <section className="grid gap-3 sm:grid-cols-2">
        <Card className="border-border bg-[#fffdf7] p-5">
          <div className="mb-2 text-xs tracking-widest text-muted-foreground">
            平均時給
          </div>
          <div className="font-mono text-2xl font-bold">
            {yen(summary.metrics.wagePerHour)}
          </div>
        </Card>
        <Card className="border-border bg-[#fffdf7] p-5">
          <div className="mb-2 text-xs tracking-widest text-muted-foreground">
            1件あたり
          </div>
          <div className="font-mono text-2xl font-bold">
            {yen(summary.metrics.perDelivery)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {summary.metrics.deliveries}件
          </div>
        </Card>
        <Card className="border-border bg-[#fffdf7] p-5">
          <div className="mb-2 text-xs tracking-widest text-muted-foreground">
            稼働日数
          </div>
          <div className="font-mono text-2xl font-bold">
            {summary.metrics.workDays}日
          </div>
        </Card>
        <Card className="border-border bg-[#fffdf7] p-5">
          <div className="mb-2 text-xs tracking-widest text-muted-foreground">
            稼働時間
          </div>
          <div className="font-mono text-2xl font-bold">
            {summary.metrics.onlineHours}時間
          </div>
        </Card>
      </section>
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm run test:run -- src/features/ledger/components/ledger-dashboard.test.tsx`
Expected: PASS（既存テスト含め全件）

- [ ] **Step 5: 最終検証（lint / typecheck / 全テスト / build）**

Run: `npm run lint && npx tsc --noEmit && npm run test:run && npm run build`
Expected: すべて成功

- [ ] **Step 6: Commit**

```bash
git add src/features/ledger/components/ledger-dashboard.tsx src/features/ledger/components/ledger-dashboard.test.tsx
git commit -m "Show monthly work days and hours cards on ledger dashboard"
```
