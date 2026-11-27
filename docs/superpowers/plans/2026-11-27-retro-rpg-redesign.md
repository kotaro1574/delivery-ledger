# レトロ RPG 風リデザイン Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** アプリ全画面を、配達スライムに合わせたレトロ RPG 風（紺の背景・白い二重枠ウィンドウ・ドット文字・▶ カーソル・ひらがなのゲーム口調）に作り直す。

**Architecture:** まず `globals.css` のトークンを紺テーマに差し替え、DotGothic16 を `next/font/google` で読み込む。次に `components/game/` に共通部品（`GameWindow`, `CommandMenu`）を作り、`Button` に game 用の variant を足す。最後に画面ごとに部品を当てて、文言を書き換える。機能・API・データは変えない。

**Tech Stack:** Next.js 16 App Router, Tailwind v4, shadcn (Radix), sonner, vitest + Testing Library, Biome

**Spec:** `docs/superpowers/specs/2026-11-27-retro-rpg-redesign-design.md`

## Global Constraints

- 色: 背景/ウィンドウ `#0b0f2a`、枠/本文 `#ffffff`、強調 `#ffd84a`、収入 `#4ad66d`、経費 `#ff6b6b`。サブテキストは紺の上で WCAG AA（4.5:1）以上
- フォント: UI 文字は DotGothic16。金額・日付・時給・入力欄の中身は `font-mono`（ドット文字にしない）。ドット文字の最小サイズは 12px
- ライト / ダークの切り替えなし。常に紺 1 種類。`themeColor` は `#0b0f2a`
- 会計用語はひらがなにしない: 勘定科目名、仕訳、青色申告、数値の指標ラベル（利益・経費・率・按分を含むもの。例: 差引利益、利益率、経費率、事業経費、経費（事業分）、経費内訳（事業分）、私用分、支払総額、最高利益日、平均利益、月別利益率）
- カタカナ語（レシート、スライム、ログイン 等）、数字と単位、メールアドレス / パスワードはそのまま
- ブラウザのタブのタイトル（metadata）と PWA 名は変えない。アプリアイコンは触らない
- タップ領域は今より小さくしない（ボタン高さ 36px 以上）
- アニメーションは `motion-safe:` の中だけで使う
- `any` 禁止、説明コメントなし、`useEffect` は新しく足さない
- 新しいライブラリは入れない。`next/font/google` の使い方は実装前に context7 で確認する
- 文言はこの対応表どおり。表にない文言はスペックの「文言のルール」で決める

| いま | これから |
| --- | --- |
| 台帳 / 年次 / 入力（ナビ） | だいちょう / ねんかん / きろくする |
| 配達収支台帳（画面上の見出し） | はいたつ しゅうし だいちょう |
| 保存する / 保存した / 保存に失敗した | セーブする / セーブした！ / セーブできなかった… |
| 更新する / 更新した / 更新に失敗した | かきかえる / かきかえた！ / かきかえられなかった… |
| 取引を削除 / 削除した / 削除に失敗した | とりひきを けす / けした / けせなかった… |
| 取引編集 | とりひきを なおす |
| 前の月 / 次の月 / 前の年 / 次の年 | まえの つき / つぎの つき / まえの とし / つぎの とし |
| 売上 / 収入 / 経費（切り替え・入力ラベル） | うりあげ / しゅうにゅう / けいひ |
| 金額 / 件数 / 稼働日 | きんがく / けんすう / はたらいた ひ |
| メモ（任意） | メモ（なくても OK） |
| 閉じる | とじる |
| 目標金額 / 目標を保存 / 目標を編集 | もくひょうきんがく / もくひょうを セーブ / もくひょうを かえる |
| 今月の目標を決めよう / N月の目標を決める | こんげつの もくひょうを きめよう / N月の もくひょうを きめる |
| ¥x 稼いだ | かせいだ ¥x |
| 次のLvまで ¥x | つぎのレベルまで ¥x |
| 目標達成！ | もくひょう たっせい！ |
| 未達 あと ¥x だった | あと ¥x たりなかった |
| 1日 ¥x ペース | 1にち ¥x ペース |
| キング達成 N回 | キング N回 |
| 目標を決めるとスライムが生まれる | もくひょうを きめると スライムが うまれる |
| Lv.N {title}の配達スライム（aria） | Lv.N {title}の はいたつスライム |
| LEVEL UP! + Lv.a → Lv.b | スライムは レベル{b}に あがった！ |
| {title}に進化！ | {title}に しんかした！ |
| 目標達成！スライムキング誕生！ | もくひょうたっせい！ スライムキングが たんじょうした！ |
| 次のLvまで あと ¥x（バナー） | つぎのレベルまで あと ¥x |
| 日別収支トレンド / この月のトレンドはまだありません | ひごとの しゅうし / この つきの きろくは まだ ない |
| 月別年次収支詳細 | つきごとの しゅうし |
| 年間売上 / 稼働時間 / 稼働日数 | ねんかん うりあげ / はたらいた じかん / はたらいた ひかず |
| ログイン（ボタン） / ログイン中... | はじめる / ロード中… |
| 今日の配達と経費をサクッと入れる | きょうの はいたつを きろくしよう |

## Review Focus

1. 小さい数字が読めること: 金額・日付・カレンダーの日付・グラフの目盛りが `font-mono` のままか。DotGothic16 が数字に当たっていないか
2. 紺の上のコントラスト: 既存の `text-muted-foreground` や `--ledger-soft` 由来の灰色が紺の上に残って読めなくなっていないか。Popover / Calendar / Sonner / Input の背景が白のまま浮いていないか
3. 会計用語が誤ってひらがなになっていないか（勘定科目のセレクト、仕訳プレビュー、年間の指標ラベル）
4. フォーカスの見え方: キーボード操作で ▶ / 黄色のフォーカス表示が出るか（紺の上で ring が見えるか）
5. スライムのスプライトとたまごが紺の背景の上でも輪郭が見えるか（暗い色のピクセルが背景に溶けないか）

---

### Task 1: テーマトークンとフォント

**Files:**
- Modify: `app/src/app/globals.css`
- Modify: `app/src/app/layout.tsx`

**Interfaces:**
- Produces: CSS 変数 `--game-bg #0b0f2a`, `--game-line #ffffff`, `--game-sub`（AA を満たす灰青）, `--game-gold #ffd84a`, `--game-income #4ad66d`, `--game-expense #ff6b6b`, `--game-saturday`, `--game-sunday`。Tailwind の `font-dot`（DotGothic16、`--font-dot` 経由）。shadcn のトークン（`--background`, `--card`, `--popover`, `--primary`, `--muted-foreground`, `--border`, `--input`, `--ring` など）を紺テーマの値にする
- `--ledger-*` は後続タスクで参照を消すまで残す（Task 9 で削除）

- [ ] **Step 1: context7 で `next/font/google` の Next.js 16 の使い方を確認する**（`variable` オプションと Tailwind v4 の `@theme` との組み合わせ）
- [ ] **Step 2: `layout.tsx` で DotGothic16（weight 400, subsets は使える範囲, `variable: "--font-dot"`）を読み込み、`<html>` に variable のクラスを付ける。`viewport.themeColor` を `#0b0f2a` に**
- [ ] **Step 3: `globals.css` を書き換える**
  - `@theme inline` に `--font-dot: var(--font-dot), "DotGothic16", monospace;` と `--font-sans` を DotGothic16 優先にする（本文全体がドット文字）
  - `:root` に `--game-*` を追加し、shadcn トークンを紺テーマに
  - `body` の背景のドット柄を消し、`bg-[var(--game-bg)]`
- [ ] **Step 4: 確認**
  Run: `cd app && npx tsc --noEmit && npm run lint && npm run test:run`
  Expected: すべて成功（見た目の変更だけなのでテストは今のまま通る）
- [ ] **Step 5: Commit** `feat: switch theme tokens to retro RPG navy and load DotGothic16`

### Task 2: 共通部品（GameWindow / CommandMenu / Button variant / Sonner）

**Files:**
- Create: `app/src/components/game/game-window.tsx`, `app/src/components/game/game-window.test.tsx`
- Create: `app/src/components/game/command-menu.tsx`, `app/src/components/game/command-menu.test.tsx`
- Modify: `app/src/components/ui/button.tsx`, `app/src/components/ui/sonner.tsx`, `input.tsx`, `textarea.tsx`, `popover.tsx`, `calendar.tsx`, `tabs.tsx`, `badge.tsx`, `card.tsx`

**Interfaces:**
- Produces:
  - `GameWindow({ title?: string; className?: string; children: ReactNode; as?: "section" | "div" })`。`title` があれば枠の上辺に重ねた見出しを出し、`section` に `aria-labelledby` でつなぐ。白い 3px 枠 + 外側に紺の線（`outline` か `box-shadow`）、角 4px
  - `CommandMenu({ items: { href: string; label: string }[]; activeHref: string; className?: string; children?: ReactNode })`。`nav` の中にリンクを並べ、`activeHref` に一致する項目に `aria-current="page"`、黄色、先頭に `▶`（`aria-hidden`）。`children` はメニュー末尾に置く追加項目（ログアウト用）
  - `Button` の variant に `game`（白枠・紺地・白文字、hover/focus で左に ▶）と `gamePrimary`（黄地・紺文字・白枠）を追加。既存 variant も紺テーマで読めるように調整
  - Sonner の toast をメッセージウィンドウ風（紺地・白枠・DotGothic16）に

- [ ] **Step 1: failing test を書く**

```tsx
it("タイトル付きのウィンドウはタイトルで名前が付く", () => {
  render(<GameWindow title="ステータス">なかみ</GameWindow>);
  expect(screen.getByRole("region", { name: "ステータス" })).toHaveTextContent("なかみ");
});

it("今いる画面の項目に aria-current と ▶ を付ける", () => {
  render(
    <CommandMenu
      activeHref="/year"
      items={[{ href: "/", label: "だいちょう" }, { href: "/year", label: "ねんかん" }]}
    />,
  );
  expect(screen.getByRole("link", { name: "ねんかん" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "だいちょう" })).not.toHaveAttribute("aria-current");
});
```

- [ ] **Step 2: Run** `cd app && npx vitest run src/components/game` → Expected: FAIL（モジュールがない）
- [ ] **Step 3: 実装する**（▶ は `aria-hidden` にしてリンク名に入れない）
- [ ] **Step 4: Run** `cd app && npx vitest run src/components/game && npx tsc --noEmit` → Expected: PASS
- [ ] **Step 5: Commit** `feat: add game window, command menu, and game button variants`

### Task 3: AppShell をコマンドメニューに

**Files:**
- Modify: `app/src/components/layout/app-shell.tsx`
- Create: `app/src/components/layout/app-shell.test.tsx`

**Interfaces:**
- Consumes: `CommandMenu`, `Button`（`game`）
- 見出しは「はいたつ しゅうし だいちょう」、サブは「UBER DELIVERY · 青色申告対応」のまま。ログアウトボタンは `CommandMenu` の `children` に入れ、`aria-label="ログアウト"`、表示文字は「ログアウト」

- [ ] **Step 1: failing test**（`next/navigation` の `usePathname` を `/input` で mock、`@/lib/auth/client` の `signOut` を mock）

```tsx
expect(screen.getByRole("link", { name: "きろくする" })).toHaveAttribute("aria-current", "page");
expect(screen.getByRole("link", { name: "だいちょう" })).toBeInTheDocument();
expect(screen.getByRole("link", { name: "ねんかん" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "ログアウト" })).toBeInTheDocument();
```

- [ ] **Step 2: Run** `cd app && npx vitest run src/components/layout` → Expected: FAIL（リンク名が違う）
- [ ] **Step 3: 実装**
- [ ] **Step 4: Run** 同じコマンド → PASS
- [ ] **Step 5: Commit** `feat: turn app shell navigation into a command menu`

### Task 4: モチベーション部品（ステータス / お祝い / 目標 / スライム）

**Files:**
- Modify: `app/src/features/motivation/components/status-panel.tsx`, `celebration-banner.tsx`, `goal-editor.tsx`, `slime-character.tsx`
- Modify tests: `status-panel.test.tsx`, `celebration-banner.test.tsx`
- Possibly modify: `app/src/features/motivation/utils/slime-sprite.ts`（Review Focus 5 で輪郭が溶ける場合のみ、外枠色を調整）

**Interfaces:**
- Consumes: `GameWindow`, `Button`（`game` / `gamePrimary`）, `--game-*`
- StatusPanel: `GameWindow` で包む。達成率バーの左に「EXP」、バーは白枠・黄（達成で緑）。文言は対応表
- CelebrationBanner: メッセージウィンドウ（`GameWindow`）。1 行目「+¥x ゲット！」、2 行目にレベルアップ文。`aria-live="polite"` は維持

- [ ] **Step 1: テストの期待文言を対応表に合わせて書き換える**（例）

```tsx
expect(screen.getByText("かせいだ ¥186,000")).toBeInTheDocument();
expect(screen.getByText("つぎのレベルまで ¥1,500")).toBeInTheDocument();
expect(screen.getByRole("img", { name: "Lv.25 エースの はいたつスライム" })).toBeInTheDocument();
expect(screen.getByText("もくひょう たっせい！")).toBeInTheDocument();
expect(screen.getByText("あと ¥200,000 たりなかった")).toBeInTheDocument();
expect(screen.getByText("キング 3回")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "こんげつの もくひょうを きめよう" })).toBeInTheDocument();
expect(screen.getByLabelText("もくひょうきんがく")).toBeInTheDocument();
expect(screen.getByText("スライムは レベル25に あがった！")).toBeInTheDocument();
expect(screen.getByText("エースに しんかした！")).toBeInTheDocument();
expect(screen.getByText("もくひょうたっせい！ スライムキングが たんじょうした！")).toBeInTheDocument();
```

- [ ] **Step 2: Run** `cd app && npx vitest run src/features/motivation` → Expected: FAIL（文言が古い）
- [ ] **Step 3: 実装**（`--ledger-*` と `#fffdf7`, `#eef4ee` の参照をなくす）
- [ ] **Step 4: Run** 同じコマンド → PASS
- [ ] **Step 5: Commit** `feat: restyle slime status and celebration as RPG windows`

### Task 5: 月の台帳（ledger-dashboard / daily-trend-card）

**Files:**
- Modify: `app/src/features/ledger/components/ledger-dashboard.tsx`, `daily-trend-card.tsx`
- Modify tests: `ledger-dashboard.test.tsx`, `daily-trend-card.test.tsx`

**Interfaces:**
- Consumes: `GameWindow`, `Button` variants, `--game-*`
- 各セクション（月の切り替え、日ごとの推移、取引一覧、取引の編集 / 削除）を `GameWindow` に。並び順は変えない。グラフの色を `--game-*` に。指標ラベル（利益・経費・率・按分）は漢字のまま

- [ ] **Step 1: テストの文言クエリを対応表に合わせて書き換える**（例: `"更新する"` → `"かきかえる"`, `"日別収支トレンド"` → `"ひごとの しゅうし"`, `"この月のトレンドはまだありません"` → `"この つきの きろくは まだ ない"`。`"差引利益"`, `"利益率"`, `"事業経費"`, `"支払総額 ¥705"`, `"私用分 ¥141"` などはそのまま）
- [ ] **Step 2: Run** `cd app && npx vitest run src/features/ledger/components/ledger-dashboard.test.tsx src/features/ledger/components/daily-trend-card.test.tsx` → Expected: FAIL
- [ ] **Step 3: 実装**
- [ ] **Step 4: Run** 同じコマンド → PASS
- [ ] **Step 5: Commit** `feat: restyle monthly ledger as RPG windows`

### Task 6: 入力画面（entry-input-form）

**Files:**
- Modify: `app/src/features/entries/components/entry-input-form.tsx`
- Modify test: `entry-input-form.test.tsx`

**Interfaces:**
- Consumes: `GameWindow`, `Button` variants
- フォーム全体を `GameWindow`（title「きろくする」）に。収入 / 経費の切り替えはコマンド選択風（選択中に ▶ と黄色、`aria-pressed` などの今の状態表現は維持）。保存ボタンは `gamePrimary`。勘定科目のセレクトと仕訳プレビューは漢字のまま

- [ ] **Step 1: テストの文言クエリを書き換える**（`"保存する"` → `"セーブする"`, `"稼働日"` → `"はたらいた ひ"`, `"売上"` → `"うりあげ"`, `/売上/` → `/うりあげ/`, `"金額"` → `"きんがく"`, `"件数"` → `"けんすう"`, ボタン `"経費"` → `"けいひ"`。`"時間"`, `"分"`, `"レシート画像"` はそのまま）
- [ ] **Step 2: Run** `cd app && npx vitest run src/features/entries` → Expected: FAIL
- [ ] **Step 3: 実装**
- [ ] **Step 4: Run** 同じコマンド → PASS
- [ ] **Step 5: Commit** `feat: restyle entry form as an RPG command window`

### Task 7: 年間画面（yearly-dashboard）

**Files:**
- Modify: `app/src/features/ledger/components/yearly-dashboard.tsx`
- Modify test: `yearly-dashboard.test.tsx`

- [ ] **Step 1: テストの文言クエリを書き換える**（`"年間売上"` → `"ねんかん うりあげ"`, `"稼働時間"` → `"はたらいた じかん"`, `"稼働日数"` → `"はたらいた ひかず"`。`"月別利益率"`, `"平均利益"`, `"最高利益日"`, `"経費率"`, `"経費（事業分）"`, `"経費内訳（事業分）"` はそのまま）
- [ ] **Step 2: Run** `cd app && npx vitest run src/features/ledger/components/yearly-dashboard.test.tsx` → Expected: FAIL
- [ ] **Step 3: 実装**（`GameWindow` で包み、グラフの色を `--game-*` に）
- [ ] **Step 4: Run** 同じコマンド → PASS
- [ ] **Step 5: Commit** `feat: restyle yearly dashboard as RPG windows`

### Task 8: ログイン / 新規登録

**Files:**
- Modify: `app/src/app/(auth)/layout.tsx`, `app/src/app/(auth)/login/page.tsx`, `app/src/app/(auth)/signup/page.tsx`

- タイトル画面風: 見出し「はいたつ しゅうし だいちょう」、フォームを `GameWindow` に、ボタンは `gamePrimary`。文言は対応表（新規登録側も同じルールで）。エラー文はルールに従い「メールアドレスか パスワードが ちがうみたい」など
- [ ] **Step 1: 実装**（テストはないので、型と lint とブラウザで確認）
- [ ] **Step 2: Run** `cd app && npx tsc --noEmit && npm run lint` → Expected: 成功
- [ ] **Step 3: Commit** `feat: restyle auth screens as an RPG title screen`

### Task 9: 後片付けとブラウザ確認

**Files:**
- Modify: `app/src/app/globals.css`（`--ledger-*` を削除）

- [ ] **Step 1: 残った参照を探す** Run: `cd app && grep -rnE "ledger-|#fffdf7|#cfc7b4|#eef4ee|font-serif" src` → Expected: 出力なし（あれば直す）
- [ ] **Step 2: 全体確認** Run: `cd app && npx tsc --noEmit && npm run lint && npm run test:run` → Expected: すべて成功
- [ ] **Step 3: Browser pane で 375px 確認**（`preview_start` の `app-dev`）: ログイン、月の台帳（目標あり / なし / `?gained=` でレベルアップ）、入力（収入・経費）、年間。Review Focus の 5 項目を目で確認
- [ ] **Step 4: Commit** `refactor: remove legacy ledger tokens`
