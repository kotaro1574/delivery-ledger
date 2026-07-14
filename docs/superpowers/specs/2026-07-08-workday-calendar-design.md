# 稼働日フィールドの shadcn Calendar 化 設計

日付: 2026-07-08

## 目的

稼働日を入力するフォームすべてで、ネイティブの `<input type="date">` を shadcn/ui の Date Picker パターン（Popover + Calendar）に置き換える。対象は次の2箇所:

1. 入力フォーム（`app/src/features/entries/components/entry-input-form.tsx`）
2. 取引編集ダイアログ（`app/src/features/ledger/components/ledger-dashboard.tsx` の「取引編集」、`id="edit-date"` フィールド）

## 決定事項

- **UI パターン**: Popover 式。稼働日ボタンをタップするとカレンダーがポップアップで開く（shadcn 公式 date-picker.mdx の構成）。インライン常時表示は不採用（フォームの縦幅が伸びすぎるため）。
- **日付制限**: 未来の日付（明日以降）は選択不可。`disabled: { after: today }` でグレーアウトする。
- **ロケール**: `react-day-picker/locale` の `ja` を `Calendar` の `locale` prop に渡して日本語表示にする。

## UI 仕様

- トリガーは `Button variant="outline"`。CalendarIcon（lucide-react）+ 日付テキストを表示する。
- 日付テキストは `2026/07/08（今日）` 形式。ヘッダーで使っている既存の `dateLabel` ロジックを流用する。date-fns は追加しない。
- ラベル `稼働日`（`htmlFor="entry-date"`）は維持する。button は labelable 要素なのでトリガーボタンに `id="entry-date"` を付けて関連付ける。
- 日付を選択したら Popover を自動で閉じる（`open` を state 管理し、`onSelect` で閉じる）。
- カレンダーの見た目はプロジェクトのテーマ変数（globals.css の CSS variables）に従う。追加のカスタム配色はしない。

## 状態管理・データフロー

- `entryDate` state は現行の `"YYYY-MM-DD"` 文字列のまま維持する。API の body と レシート OCR の `result.date` 反映が文字列前提のため。
- 変換は境界でのみ行う:
  - 文字列 → Date: `new Date(year, month - 1, day)` でローカルタイムとして生成する。`new Date("YYYY-MM-DD")` は UTC 解釈で日付がずれる可能性があるため使わない。
  - Date → 文字列: 既存 `todayString()` と同じ整形ロジックを `Date` 引数を取る関数に一般化して共用する。
- `onSelect` が `undefined` を渡してきた場合（選択済みの日を再タップ）は無視して現在の選択を維持する。
- 日付変更時は現行どおり `setSaved(false)` を呼ぶ。

## 追加コンポーネント・依存

- `npx shadcn@latest add calendar popover` を実行する。
  - 追加されるファイル: `src/components/ui/calendar.tsx`, `src/components/ui/popover.tsx`
  - 追加される依存: `react-day-picker`（v10 が入った）, `radix-ui`（CLI は scoped の `@radix-ui/react-popover` ではなくモノリスパッケージを追加した）

## 取引編集ダイアログ（追補 2026-07-12）

- 編集ダイアログの稼働日フィールドにも入力フォームと同一の Popover + Calendar パターンを適用する（ja locale・未来日選択不可・選択で自動クローズ・`variant="outline"` トリガー + CalendarIcon・`YYYY/MM/DD（今日）` 表示）。
- ダイアログを開閉した際に Popover の開状態が持ち越されないよう、ダイアログの open/close 時に Popover の open state をリセットする。
- 日付ヘルパーは `app/src/lib/date.ts` に抽出して両コンポーネントで共有する: `formatDateString(date: Date): string`、`todayString(): string`、`parseDateString(value: string): Date`、`formatDateLabel(value: string): string`（`YYYY/MM/DD`、今日なら `（今日）` サフィックス）。`entry-input-form.tsx` のローカル実装はこの共有版に置き換える。
- 編集ダイアログは Radix Dialog ではなく `fixed inset-0 z-50` の自前オーバーレイ。PopoverContent は body へ portal され DOM 順で後になるため、同じ `z-50` でもカレンダーはダイアログの上に描画される（実装時に目視確認すること）。

## 取引編集ダイアログのフォームスタイル統一（追補 2026-07-14）

編集ダイアログの入力欄は入力フォームと同一の見た目・挙動にする:

- 金額（売上/金額）の表示は `Number(value).toLocaleString("ja-JP")` によるカンマ区切り（空なら空文字、`onChange` は `numberOnly` で数字のみ保持）。
- 件数・オンライン時間（時間/分）の枠は `flex h-12 items-center`、内側の `Input` は `min-w-0`、単位ラベル（件/時間/分）は `shrink-0 whitespace-nowrap`。入力フォームの実装が正。

## テスト

`app/src/features/entries/components/entry-input-form.test.tsx` を更新する:

- 「選択した稼働日を収入保存のdateとして送信する」: `fireEvent.change` での日付入力を「トリガーボタンをクリック → カレンダーの日付セルをクリック」に書き換える。選択対象は表示中の月（当月）の過去日とし、期待値はテスト内で動的に算出する。
- 「経費レシートOCR結果をフォームに反映する」: `toHaveValue("2026-06-10")` をトリガーボタンの表示テキスト検証（`toHaveTextContent("2026/06/10")`）に変更する。
- 追加テスト: 未来日（明日）のセルが disabled であることを検証する。

`app/src/features/ledger/components/ledger-dashboard.test.tsx` に追加する（追補 2026-07-12）:

- 編集ダイアログを開き、カレンダーで別の日を選択して「更新する」を押すと、PATCH body の `date` に選択日が入ることを検証する。

## エラーハンドリング

追加なし。`entryDate` は初期値が今日で、カレンダー選択またはレシート OCR の反映（サーバー側で `^\d{4}-\d{2}-\d{2}$` 検証済み）でしか変化しないため常に有効なフォーマット。未来日の禁止はカレンダー UI でのみ強制し、OCR 経由の未来日は保存時にはチェックしない（レシートの日付が未来になるケースは実運用上想定しない）。保存時バリデーション（`!entryDate` チェック）は現状のまま。
