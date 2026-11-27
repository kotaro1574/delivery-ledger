# 経費を勘定科目ごとに 1 年分見る Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 年と勘定科目を選んで、その年の経費の合計・月ごとの合計・明細（なおす / けす付き）を 1 ページで見られるようにする。

**Architecture:** サービスに年×科目の明細取得を足し、純粋関数で合計と月別を出す。だいちょうの明細一覧と編集ダイアログを `EntryLedger` に切り出して両ページで使う。

**Tech Stack:** Next.js 16 App Router / Drizzle (D1) / vitest + Testing Library / Biome

**Spec:** `docs/superpowers/specs/2026-11-27-expense-category-year-design.md`

## Global Constraints

- URL は `/year/expenses?year=YYYY&category=NNN`。不正な year は今年（Asia/Tokyo）、不正な category は `601`
- 科目は `expenseCategories`（601 車両費 / 603 通信費 / 604 消耗品費 / 605 損害保険料 / 606 修繕費 / 699 雑費）
- 文言はひらがなのゲーム口調。科目名・事業分・私用分は漢字
- `any` 禁止、説明コメントなし、`useEffect` 極力なし
- DB スキーマは変えない

## Review Focus

- 月をまたぐ・年をまたぐ境界（12/31 と 1/1）が正しい年に入るか
- 按分した経費で、合計が事業分（businessAmount）と支払額（amount）を取り違えていないか
- 明細を消したあと、合計と月別がすぐ更新されるか（`router.refresh()`）
- 他人の経費が混ざらないか（userId 条件）
- `/year/expenses` でメニューの「ねんかん」が選択中になるか

---

### Task 1: 年×科目の経費取得と集計

**Files:**
- Modify: `app/server/modules/entries/service.ts`
- Create: `app/server/modules/entries/category-year.ts`, `category-year.test.ts`

**Interfaces:**
- Produces:
  - `EntriesService.listExpenses(userId: string, year: string, categoryCode: string): Promise<EntriesModel.ListResponse>`
    - `list` と同じ形の明細を返す。新しい順
    - 行の組み立ては `list` と共通の関数にする
  - `summarizeCategoryYear(items: EntriesModel.Item[]): { business: number; paid: number; months: number[] }`
    - `months` は長さ 12 で、index 0 が 1 月の事業分合計

- [ ] **Step 1: 失敗するテスト**（`category-year.test.ts`）
  - 「事業分と支払額を別々に合計する」
    - 入力：私用分のある 2 件
    - 期待：business は businessAmount の和、paid は amount の和
  - 「月ごとの事業分を12か月に振り分ける」
    - 入力：1/31 と 12/1 の 2 件
    - 期待：months[0] と months[11] に入り、長さは 12
  - 「明細がなければすべて0」
- [ ] **Step 2: 失敗を確認**
  - Run: `cd app && npx vitest run server/modules/entries/category-year.test.ts`
  - Expected: FAIL（モジュールなし）
- [ ] **Step 3: 実装**
  - `summarizeCategoryYear` を書く
  - `listExpenses` を書く。条件は次の 4 つ
    - `eq(userId)`
    - `like(entryDate, "YYYY-%")`
    - `eq(entryDetails.kind, "expense")`
    - `eq(entryDetails.categoryCode, code)`
  - 行の組み立ては `list` から関数に切り出して共通にする
- [ ] **Step 4: 通ることを確認**
  - Run: `cd app && npx vitest run server`
  - Expected: PASS
- [ ] **Step 5: コミット**
  - `feat: list a year of expenses for one account category`

### Task 2: 明細一覧と編集ダイアログを部品に切り出す

**Files:**
- Create: `app/src/features/ledger/components/entry-ledger.tsx`
- Modify: `app/src/features/ledger/components/ledger-dashboard.tsx`
- Test: 既存の `ledger-dashboard.test.tsx`（振る舞いを変えないので、そのまま全部通ること）

**Interfaces:**
- Produces: `EntryLedger({ title, entries, emptyText }: { title: string; entries: EntriesModel.Item[]; emptyText: string })`
  - 中身は今の「まいにちの とりひき」の GameWindow、編集ダイアログ、削除確認ダイアログ
  - state とハンドラも一緒に移す

- [ ] **Step 1: 切り出す前に既存テストが通ることを確認**
  - Run: `cd app && npx vitest run src/features/ledger`
  - Expected: PASS
- [ ] **Step 2: 移動**
  - `LedgerDashboard` は `<EntryLedger title="まいにちの とりひき" emptyText="この つきの とりひきは まだ ない" entries={entries} />` を使う
  - 使わなくなった import や関数は消す
- [ ] **Step 3: 同じテストが全部通ることを確認**
  - Run: `cd app && npx vitest run src/features/ledger && npx tsc --noEmit`
  - Expected: PASS（振る舞いは変えないリファクタなので、新しいテストは書かない）
- [ ] **Step 4: コミット**
  - `refactor: extract entry list with edit and delete dialogs`

### Task 3: けいひの きろく ページと入り口

**Files:**
- Create:
  - `app/src/app/(dashboard)/year/expenses/page.tsx`
  - `app/src/features/ledger/components/expense-category-year.tsx`
  - `app/src/features/ledger/components/expense-category-year.test.tsx`
- Modify:
  - `app/src/features/ledger/components/yearly-dashboard.tsx`（経費内訳の行をリンクにする）
  - `app/src/components/game/command-menu.tsx`（下の階層でも選択中にする）
  - `command-menu.test.tsx`
  - `yearly-dashboard` のテスト

**Interfaces:**
- Consumes: Task 1 `listExpenses` / `summarizeCategoryYear`、Task 2 `EntryLedger`
- Produces: `ExpenseCategoryYear({ year, categoryCode, entries }: { year: string; categoryCode: string; entries: EntriesModel.Item[] })`

- [ ] **Step 1: 失敗するテスト**
  - `expense-category-year.test.tsx`
    - 「選んだ年と科目の合計と明細の件数を出す」
      - 見出し「2026年の けいひ」
      - 「車両費」が選択中（`aria-current="page"`）
      - 合計 ¥ と「めいさい（2けん）」
    - 「科目のボタンは同じ年の別の科目へリンクする」
      - 「通信費」の href が `/year/expenses?year=2026&category=603`
    - 「年の切り替えは同じ科目の前後の年へリンクする」
      - 「まえの とし」の href が `?year=2025&category=601`
    - 「明細がない科目は空表示」
      - 「この としの 車両費は まだ ない」
  - `command-menu.test.tsx`：「下の階層のページでも親の項目を選択中にする」
    - activeHref が `/year/expenses` のとき、「ねんかん」が `aria-current="page"`
    - 「だいちょう」（`/`）は選択中にならない
  - yearly-dashboard のテスト：「経費内訳の行はその科目の1年分のページへリンクする」
- [ ] **Step 2: 失敗を確認**
  - Run: `cd app && npx vitest run src/features/ledger src/components/game`
  - Expected: FAIL
- [ ] **Step 3: 実装**
  - ページ：認証は既存ページと同じ。year / category を検証して `listExpenses` を呼ぶ
  - コンポーネント：GameWindow で組む
    - 年の切り替え
    - 科目ボタン（`Link`、選択中は金色＋▶）
    - 合計
    - 「つきごと」の棒グラフ（12 本、0 円の月は低い棒）
    - `EntryLedger`（タイトルは `めいさい（N けん）`）
  - 経費内訳の行を `Link` にする
  - CommandMenu の判定を「完全一致、または `href !== "/"` で `activeHref` が `href + "/"` で始まる」にする
- [ ] **Step 4: 通ることを確認**
  - Run: `cd app && npx vitest run && npx tsc --noEmit && npx biome check`
  - Expected: 全部成功
- [ ] **Step 5: Browser pane（375px）で確認**
  - ねんかん → 車両費 → 科目と年の切り替え → なおす / けす
- [ ] **Step 6: コミット**
  - `feat: browse a year of expenses by account category`
