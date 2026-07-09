# 稼働日フィールド shadcn Calendar 化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 入力フォームの稼働日フィールドをネイティブ `<input type="date">` から shadcn/ui の Date Picker（Popover + Calendar）に置き換える。

**Architecture:** shadcn 公式 Date Picker パターン（Popover トリガーボタン + Calendar）を採用。`entryDate` state は `"YYYY-MM-DD"` 文字列のまま維持し、Calendar との境界でのみ Date オブジェクトに変換する。未来日は `disabled={{ after: today }}` で選択不可にする。

**Tech Stack:** Next.js (App Router) / shadcn/ui (new-york style, Radix) / react-day-picker v9 / Vitest + Testing Library / Biome

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
