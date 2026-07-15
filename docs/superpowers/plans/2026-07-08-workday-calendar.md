# 稼働日フィールド shadcn Calendar 化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 入力フォームの稼働日フィールドをネイティブ `<input type="date">` から shadcn/ui の Date Picker（Popover + Calendar）に置き換える。

**Architecture:** shadcn 公式 Date Picker パターン（Popover トリガーボタン + Calendar）を採用。`entryDate` state は `"YYYY-MM-DD"` 文字列のまま維持し、Calendar との境界でのみ Date オブジェクトに変換する。未来日は `disabled={{ after: today }}` で選択不可にする。

**Tech Stack:** Next.js (App Router) / shadcn/ui (new-york style, Radix) / react-day-picker v10 / Vitest + Testing Library / Biome

## Global Constraints

- spec: `docs/superpowers/specs/2026-07-08-workday-calendar-design.md`
- 作業ディレクトリはリポジトリ直下の `app/`。npm scripts はすべて `app/` で実行する。
- date-fns は追加しない。日付整形は既存ロジックの一般化で行う。
- `entryDate` の内部表現は `"YYYY-MM-DD"` 文字列を維持する（API body / レシート OCR が文字列前提）。
- 文字列 → Date 変換は `new Date(year, month - 1, day)` を使う。`new Date("YYYY-MM-DD")` は UTC 解釈になるため禁止。
- コード内コメントは書かない。`any` 禁止。
- lint: `npm run lint`（biome check）、テスト: `npm run test:run`。

---

### Task 1: shadcn Calendar / Popover コンポーネントの導入

**Files:**
- Create: `app/src/components/ui/calendar.tsx`（shadcn CLI が生成）
- Create: `app/src/components/ui/popover.tsx`（shadcn CLI が生成）
- Modify: `app/package.json`（CLI が `react-day-picker` / `@radix-ui/react-popover` を追加）

**Interfaces:**
- Consumes: なし
- Produces: `Calendar`（`@/components/ui/calendar`、`mode` / `selected` / `onSelect` / `disabled` / `locale` / `defaultMonth` props を持つ react-day-picker ラッパー）、`Popover` / `PopoverTrigger` / `PopoverContent`（`@/components/ui/popover`）

- [ ] **Step 1: shadcn CLI でコンポーネントを追加**

Run: `cd app && npx shadcn@latest add calendar popover`

Expected: `src/components/ui/calendar.tsx` と `src/components/ui/popover.tsx` が作成され、`package.json` に `react-day-picker` と `@radix-ui/react-popover` が追加される。

- [ ] **Step 2: 生成物を確認**

Run: `ls app/src/components/ui/calendar.tsx app/src/components/ui/popover.tsx && grep -E "react-day-picker|react-popover" app/package.json`

Expected: 両ファイルが存在し、依存が package.json に載っている。

さらに `app/src/components/ui/popover.tsx` を開き、`PopoverTrigger` の合成 API を確認する:
- `@radix-ui/react-popover` ベースなら `asChild` prop（この project の既存依存は Radix なのでこちらの想定）
- Base UI ベース（`render` prop）だった場合は Task 2 のトリガー部分を `render={<Button ... />}` 形式に読み替える

- [ ] **Step 3: 既存テストが壊れていないことを確認**

Run: `cd app && npm run test:run`

Expected: 既存テストすべて PASS。

- [ ] **Step 4: Commit**

```bash
git add app/src/components/ui/calendar.tsx app/src/components/ui/popover.tsx app/package.json app/package-lock.json
git commit -m "Add shadcn calendar and popover components"
```

---

### Task 2: 稼働日フィールドを Date Picker に置き換え（TDD）

**Files:**
- Modify: `app/src/features/entries/components/entry-input-form.tsx:37-40, 111-345`
- Test: `app/src/features/entries/components/entry-input-form.test.tsx`

**Interfaces:**
- Consumes: Task 1 の `Calendar` / `Popover` / `PopoverTrigger` / `PopoverContent`、`react-day-picker/locale` の `ja`
- Produces: なし（コンポーネント内部の変更のみ。API リクエスト body は現状と同一）

- [ ] **Step 1: テストを新 UI 前提に書き換える**

`app/src/features/entries/components/entry-input-form.test.tsx` を編集する。

テストの決定性のため、日付操作するテストでは Date のみ fake する（vitest 公式: `vi.useFakeTimers({ toFake: ["Date"] })` + `vi.setSystemTime`。setTimeout 等は fake しないので userEvent / waitFor はそのまま動く）。

`afterEach` に timer 復元を追加:

```tsx
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    pushMock.mockReset();
  });
```

「選択した稼働日を収入保存のdateとして送信する」テストを以下に置き換える（システム時刻を 2026-06-15 に固定し、カレンダーで 6/4 を選択する。グリッド末尾に翌月 7/4 が outside day として表示されるが未来日なので disabled になっており、`!button.disabled` フィルタで当月 6/4 だけが一意に取れる）:

```tsx
  it("選択した稼働日を収入保存のdateとして送信する", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 5, 15));
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Response.json({ id: "entry-1" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<EntryInputForm />);

    await userEvent.click(screen.getByLabelText("稼働日"));
    const dayButton = screen
      .getAllByRole("button")
      .filter(
        (button): button is HTMLButtonElement =>
          button instanceof HTMLButtonElement,
      )
      .find((button) => button.textContent === "4" && !button.disabled);
    expect(dayButton).toBeDefined();
    await userEvent.click(dayButton as HTMLButtonElement);

    fireEvent.change(screen.getByLabelText(/売上/), {
      target: { value: "8200" },
    });
    await userEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const entryCall = fetchMock.mock.calls.find(
      ([url]) => url === "/api/entries",
    );

    expect(entryCall).toBeDefined();
    expect(JSON.parse(String(entryCall?.[1]?.body))).toMatchObject({
      kind: "income",
      date: "2026-06-04",
      amount: 8200,
    });
    expect(screen.getByLabelText("稼働日")).toHaveTextContent("2026/06/04");
  });
```

未来日 disabled の検証テストを describe 内に追加する:

```tsx
  it("未来の日付はカレンダーで選択できない", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 5, 15));

    render(<EntryInputForm />);

    await userEvent.click(screen.getByLabelText("稼働日"));
    const tomorrowButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent === "16");

    expect(tomorrowButton).toBeDefined();
    expect(tomorrowButton).toBeDisabled();
  });
```

「経費レシートOCR結果をフォームに反映する」テストの稼働日アサーション（`toHaveValue("2026-06-10")` の行）を表示テキスト検証に変更する:

```tsx
    expect(screen.getByLabelText("稼働日")).toHaveTextContent("2026/06/10");
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `cd app && npm run test:run -- src/features/entries/components/entry-input-form.test.tsx`

Expected: 書き換えた2件と追加した1件が FAIL（現状はネイティブ input なので、稼働日クリックでカレンダーが開かず日付ボタンが見つからない / toHaveTextContent が合わない）。その他のテストは PASS のまま。

- [ ] **Step 3: 実装**

`app/src/features/entries/components/entry-input-form.tsx` を編集する。

import を変更（lucide の `Calendar` は `CalendarIcon` に alias して shadcn の `Calendar` と衝突を回避）:

```tsx
import {
  Calendar as CalendarIcon,
  Camera,
  Check,
  ChevronDown,
  Loader2,
  ScanText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ja } from "react-day-picker/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
```

`todayString()`（37-40行目）を Date 引数版に一般化し、文字列→Date のパーサーを追加する:

```tsx
function formatDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function todayString() {
  return formatDateString(new Date());
}

function parseDateString(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
```

コンポーネント内に Popover の開閉 state を追加する（`entryDate` state の宣言の直後）:

```tsx
const [dateOpen, setDateOpen] = useState(false);
```

稼働日フィールド（現在の 328-345 行目の `<div className="mb-5">...</div>` ブロック）を以下に置き換える。button は labelable 要素なので既存の `<label htmlFor="entry-date">` との関連付けはそのまま機能する:

```tsx
        <div className="mb-5">
          <label
            className="mb-2 block text-xs tracking-widest text-muted-foreground"
            htmlFor="entry-date"
          >
            稼働日
          </label>
          <Popover onOpenChange={setDateOpen} open={dateOpen}>
            <PopoverTrigger asChild>
              <Button
                className="w-full justify-start bg-background font-mono font-normal"
                id="entry-date"
                type="button"
                variant="outline"
              >
                <CalendarIcon className="size-4 text-muted-foreground" />
                {dateLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                defaultMonth={parseDateString(entryDate)}
                disabled={{ after: new Date() }}
                locale={ja}
                mode="single"
                onSelect={(date) => {
                  if (date) {
                    setEntryDate(formatDateString(date));
                    setSaved(false);
                  }
                  setDateOpen(false);
                }}
                selected={parseDateString(entryDate)}
              />
            </PopoverContent>
          </Popover>
        </div>
```

トリガーの表示テキストは既存の `dateLabel`（`2026/07/08（今日）` 形式）をそのまま使う。ヘッダー表示と自動的に一致する。

Task 1 Step 2 で popover が Base UI ベース（`render` prop）だと判明していた場合は、`<PopoverTrigger asChild><Button ... /></PopoverTrigger>` を `<PopoverTrigger render={<Button ... />}>` 形式に読み替える。

- [ ] **Step 4: 対象テストが通ることを確認**

Run: `cd app && npm run test:run -- src/features/entries/components/entry-input-form.test.tsx`

Expected: 全件 PASS。

- [ ] **Step 5: 全テスト + lint + 型チェック**

Run: `cd app && npm run test:run && npm run lint && npx tsc --noEmit`

Expected: すべて成功。biome の import 順序エラーが出たら `npm run format` で修正して再実行。

- [ ] **Step 6: Commit**

```bash
git add app/src/features/entries/components/entry-input-form.tsx app/src/features/entries/components/entry-input-form.test.tsx
git commit -m "Replace workday date input with shadcn calendar date picker"
```

---

### Task 3: 取引編集ダイアログの稼働日を Date Picker に置き換え + 日付 util 共通化（TDD）

**Files:**
- Create: `app/src/lib/date.ts`
- Modify: `app/src/features/entries/components/entry-input-form.tsx`（ローカル日付ヘルパーを共有版 import に置き換え）
- Modify: `app/src/features/ledger/components/ledger-dashboard.tsx`（編集ダイアログの date Input を Popover + Calendar に置き換え）
- Test: `app/src/features/ledger/components/ledger-dashboard.test.tsx`

**Interfaces:**
- Consumes: Task 1 の `Calendar` / `Popover` / `PopoverTrigger`（asChild）/ `PopoverContent`、`react-day-picker/locale` の `ja`、Task 2 が entry-input-form に実装した日付ヘルパーのロジック
- Produces: `@/lib/date` から `formatDateString(date: Date): string` / `todayString(): string` / `parseDateString(value: string): Date` / `formatDateLabel(value: string): string` を export

- [ ] **Step 1: 失敗するテストを追加する**

`app/src/features/ledger/components/ledger-dashboard.test.tsx` を編集する。

`afterEach` に timer 復元を追加:

```tsx
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
```

describe 内に以下のテストを追加する（システム時刻を 2026-06-15 に固定。fixture の date は 2026-06-10 なのでカレンダーは 2026年6月で開き、「4」のセルは当月 6/4（enabled）と outside day 7/4（未来日で disabled）のみ。`!button.disabled` フィルタで 6/4 が一意に取れる）:

```tsx
  it("編集ダイアログのカレンダーで稼働日を変更してPATCHに送信する", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 5, 15));
    const fetchMock = vi.fn(async () => Response.json({ id: "entry-1" }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LedgerDashboard
        month="2026-06"
        summary={summary}
        entries={[
          {
            id: "entry-1",
            date: "2026-06-10",
            kind: "income",
            category: "売上高",
            categoryCode: "501",
            description: "夜ピーク",
            amount: 8200,
            deliveries: 8,
            onlineMinutes: 270,
            receiptKey: null,
            businessAmount: null,
            privateAmount: null,
          },
        ]}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "編集 夜ピーク" }),
    );
    await userEvent.click(screen.getByLabelText("稼働日"));
    const dayButton = screen
      .getAllByRole("button")
      .filter(
        (button): button is HTMLButtonElement =>
          button instanceof HTMLButtonElement,
      )
      .find((button) => button.textContent === "4" && !button.disabled);
    expect(dayButton).toBeDefined();
    await userEvent.click(dayButton as HTMLButtonElement);
    expect(screen.getByLabelText("稼働日")).toHaveTextContent("2026/06/04");
    await userEvent.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/entries/entry-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          kind: "income",
          date: "2026-06-04",
          amount: 8200,
          deliveries: 8,
          onlineMinutes: 270,
          memo: "夜ピーク",
        }),
      }),
    );
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `cd app && npm run test:run -- src/features/ledger/components/ledger-dashboard.test.tsx`

Expected: 追加した1件が FAIL（現状はネイティブ input なので `getByLabelText("稼働日")` クリックでカレンダーが開かず、`dayButton` が undefined になり `expect(dayButton).toBeDefined()` で落ちる）。既存テストは PASS のまま。

- [ ] **Step 3: 共有 util を作成する**

`app/src/lib/date.ts` を新規作成:

```tsx
export function formatDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayString() {
  return formatDateString(new Date());
}

export function parseDateString(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateLabel(value: string) {
  const label = value.replaceAll("-", "/");
  return value === todayString() ? `${label}（今日）` : label;
}
```

- [ ] **Step 4: entry-input-form を共有 util に切り替える**

`app/src/features/entries/components/entry-input-form.tsx` を編集する:

1. ローカルの `formatDateString` / `todayString` / `parseDateString` 関数定義を削除し、import に追加する:

```tsx
import {
  formatDateString,
  formatDateLabel,
  parseDateString,
  todayString,
} from "@/lib/date";
```

2. コンポーネント内の `const today = todayString();` と、`dateLabel` の三項演算子による算出を削除し、以下に置き換える:

```tsx
const dateLabel = formatDateLabel(entryDate);
```

（`todayString()` は `entryDate` の useState 初期値でのみ使用が残る）

- [ ] **Step 5: 編集ダイアログを Popover + Calendar に置き換える**

`app/src/features/ledger/components/ledger-dashboard.tsx` を編集する:

1. import を追加（lucide の `Calendar` は `CalendarIcon` に alias。`Button` / `Calendar` / `Popover` 系 / `ja` / 日付 util を追加）:

```tsx
import { Calendar as CalendarIcon } from "lucide-react";
import { ja } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatDateLabel,
  formatDateString,
  parseDateString,
} from "@/lib/date";
```

既存の lucide import（`X` など）とはマージすること。

2. `const [saving, setSaving] = useState(false);` の近くに Popover 開閉 state を追加:

```tsx
const [dateOpen, setDateOpen] = useState(false);
```

3. `openEdit` と `closeEdit` の両方で開状態をリセット（ダイアログ開閉で Popover が開いたまま持ち越されるのを防ぐ）:

```tsx
  const openEdit = (entry: EntriesModel.Item) => {
    setEditing(entry);
    setForm(initialEditForm(entry));
    setDateOpen(false);
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(null);
    setDateOpen(false);
  };
```

4. 稼働日フィールド（`<label htmlFor="edit-date">` 直下の `<Input ... id="edit-date" type="date" ... />`）を以下に置き換える:

```tsx
                <Popover onOpenChange={setDateOpen} open={dateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className="w-full justify-start bg-background font-mono font-normal"
                      id="edit-date"
                      type="button"
                      variant="outline"
                    >
                      <CalendarIcon className="size-4 text-muted-foreground" />
                      {formatDateLabel(form.date)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      defaultMonth={parseDateString(form.date)}
                      disabled={{ after: new Date() }}
                      locale={ja}
                      mode="single"
                      onSelect={(date) => {
                        if (date) {
                          updateForm({ date: formatDateString(date) });
                        }
                        setDateOpen(false);
                      }}
                      selected={parseDateString(form.date)}
                    />
                  </PopoverContent>
                </Popover>
```

`Input` がこのファイルで他に使われている場合は import を残す。使われていなければ import から外す。

- [ ] **Step 6: 対象テストが通ることを確認**

Run: `cd app && npm run test:run -- src/features/ledger/components/ledger-dashboard.test.tsx src/features/entries/components/entry-input-form.test.tsx`

Expected: 全件 PASS（entry-input-form 側は import 差し替えのみで挙動不変）。

- [ ] **Step 7: 全テスト + lint + 型チェック**

Run: `cd app && npm run test:run && npm run lint && npx tsc --noEmit`

Expected: すべて成功。biome の import 順序エラーが出たら `npm run format` で修正して再実行。

- [ ] **Step 8: Commit**

```bash
git add app/src/lib/date.ts app/src/features/entries/components/entry-input-form.tsx app/src/features/ledger/components/ledger-dashboard.tsx app/src/features/ledger/components/ledger-dashboard.test.tsx
git commit -m "Replace edit dialog date input with shadcn calendar and share date utils"
```

---

### Task 4: 取引編集ダイアログのフォームスタイルを入力フォームに統一（TDD）

**Files:**
- Modify: `app/src/features/ledger/components/ledger-dashboard.tsx`（金額のカンマ区切り表示、件数/オンライン時間の枠スタイル）
- Test: `app/src/features/ledger/components/ledger-dashboard.test.tsx`

**Interfaces:**
- Consumes: 既存の `numberOnly` / `minuteOnly` / `updateForm`（変更しない）
- Produces: なし（表示スタイルのみの変更。PATCH body は不変）

参照実装: `app/src/features/entries/components/entry-input-form.tsx` の金額 input と 件数/時間/分 の枠。

- [ ] **Step 1: 失敗するテストを追加する**

`app/src/features/ledger/components/ledger-dashboard.test.tsx` の describe 内に以下の2テストを追加する（fixture は既存テストと同じ収入エントリを使う）:

```tsx
  it("編集ダイアログの金額をカンマ区切りで表示する", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: "entry-1" }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LedgerDashboard
        month="2026-06"
        summary={summary}
        entries={[
          {
            id: "entry-1",
            date: "2026-06-10",
            kind: "income",
            category: "売上高",
            categoryCode: "501",
            description: "夜ピーク",
            amount: 8200,
            deliveries: 8,
            onlineMinutes: 270,
            receiptKey: null,
            businessAmount: null,
            privateAmount: null,
          },
        ]}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "編集 夜ピーク" }),
    );

    expect(screen.getByLabelText("売上")).toHaveValue("8,200");

    fireEvent.change(screen.getByLabelText("売上"), {
      target: { value: "9400" },
    });

    expect(screen.getByLabelText("売上")).toHaveValue("9,400");
  });

  it("編集ダイアログの件数とオンライン時間の入力枠を同じ高さで表示する", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: "entry-1" }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LedgerDashboard
        month="2026-06"
        summary={summary}
        entries={[
          {
            id: "entry-1",
            date: "2026-06-10",
            kind: "income",
            category: "売上高",
            categoryCode: "501",
            description: "夜ピーク",
            amount: 8200,
            deliveries: 8,
            onlineMinutes: 270,
            receiptKey: null,
            businessAmount: null,
            privateAmount: null,
          },
        ]}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "編集 夜ピーク" }),
    );

    expect(screen.getByLabelText("件数").parentElement).toHaveClass("h-12");
    expect(screen.getByLabelText("時間").parentElement).toHaveClass("h-12");
    expect(screen.getByLabelText("分").parentElement).toHaveClass("h-12");
    expect(screen.getByText("時間")).toHaveClass("whitespace-nowrap");
    expect(screen.getByText("分")).toHaveClass("whitespace-nowrap");
  });
```

注意: 既存テスト「収入取引を編集できる」は `fireEvent.change` で "9400" を入れて PATCH body の `amount: 9400` を検証している。`numberOnly` がカンマを剥がすため、この既存テストは無変更で PASS し続けること（変更してはいけない）。

- [ ] **Step 2: テストが失敗することを確認**

Run: `cd app && npm run test:run -- src/features/ledger/components/ledger-dashboard.test.tsx`

Expected: 追加した2件が FAIL（`toHaveValue("8,200")` が生の "8200" と不一致 / `h-12`・`whitespace-nowrap` クラスが無い）。既存テストは PASS のまま。

- [ ] **Step 3: 実装**

`app/src/features/ledger/components/ledger-dashboard.tsx` を編集する。参照実装は entry-input-form.tsx。

1. 金額 input（`id="edit-amount"`）の `value` をカンマ区切り表示に変更:

```tsx
                  <input
                    className="w-full bg-transparent font-mono text-4xl font-bold outline-none placeholder:text-[#cfc7b4]"
                    id="edit-amount"
                    inputMode="numeric"
                    onChange={(event) =>
                      updateForm({ amount: numberOnly(event.target.value) })
                    }
                    placeholder="0"
                    value={
                      form.amount
                        ? Number(form.amount).toLocaleString("ja-JP")
                        : ""
                    }
                  />
```

2. 件数の枠（`id="edit-deliveries"` を包む div）を入力フォームと同じスタイルに変更:

```tsx
                    <div className="flex h-12 items-center rounded-lg border border-border bg-background px-3 py-2">
                      <Input
                        className="h-auto min-w-0 border-0 bg-transparent p-0 font-mono shadow-none focus-visible:ring-0"
                        id="edit-deliveries"
                        inputMode="numeric"
                        onChange={(event) =>
                          updateForm({
                            deliveries: numberOnly(event.target.value),
                          })
                        }
                        placeholder="0"
                        value={form.deliveries}
                      />
                      <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                        件
                      </span>
                    </div>
```

3. 時間の枠（`htmlFor="edit-online-hours"` の label）を同様に変更:

```tsx
                      <label
                        className="flex h-12 items-center rounded-lg border border-border bg-background px-3 py-2"
                        htmlFor="edit-online-hours"
                      >
                        <Input
                          className="h-auto min-w-0 border-0 bg-transparent p-0 font-mono shadow-none focus-visible:ring-0"
                          id="edit-online-hours"
                          inputMode="numeric"
                          onChange={(event) =>
                            updateForm({
                              onlineHours: numberOnly(event.target.value),
                            })
                          }
                          placeholder="0"
                          value={form.onlineHours}
                        />
                        <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                          時間
                        </span>
                      </label>
```

4. 分の枠（`htmlFor="edit-online-minutes"` の label）を同様に変更:

```tsx
                      <label
                        className="flex h-12 items-center rounded-lg border border-border bg-background px-3 py-2"
                        htmlFor="edit-online-minutes"
                      >
                        <Input
                          className="h-auto min-w-0 border-0 bg-transparent p-0 font-mono shadow-none focus-visible:ring-0"
                          id="edit-online-minutes"
                          inputMode="numeric"
                          maxLength={2}
                          onChange={(event) =>
                            updateForm({
                              onlineMinutes: minuteOnly(event.target.value),
                            })
                          }
                          placeholder="0"
                          value={form.onlineMinutes}
                        />
                        <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                          分
                        </span>
                      </label>
```

- [ ] **Step 4: 対象テストが通ることを確認**

Run: `cd app && npm run test:run -- src/features/ledger/components/ledger-dashboard.test.tsx`

Expected: 全件 PASS（既存テスト含む）。

- [ ] **Step 5: 全テスト + lint + 型チェック**

Run: `cd app && npm run test:run && npm run lint && npx tsc --noEmit`

Expected: すべて成功。

- [ ] **Step 6: Commit**

```bash
git add app/src/features/ledger/components/ledger-dashboard.tsx app/src/features/ledger/components/ledger-dashboard.test.tsx
git commit -m "Align edit dialog amount formatting and field layout with entry form"
```
