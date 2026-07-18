# 月次の稼働日数・稼働時間表示 設計

日付: 2026-07-18

## 目的

月次ダッシュボード（トップページ）に、その月に何日稼働したか（稼働日数）と何時間稼働したか（稼働時間）を表示する。

## 決定事項

- **稼働日の定義**: 収入（売上）エントリが1件でもある日を稼働日としてカウントする。経費だけ記録した日は含まない。legacy `daily_stats` にのみ記録がある日（deliveries または onlineMinutes が正の値）も、既存の稼働時間・件数の合算ルールと同じ扱いでカウントに含める。
- **稼働時間の定義**: 既存の `metrics.onlineHours`（`entry_details.online_minutes` + legacy `daily_stats.online_minutes` の合算を時間換算・小数1桁丸め）をそのまま使う。新規集計はしない。
- **表示場所**: 月次ダッシュボードのみ。年次ページ（/year）には出さない。
- **集計場所**: server 側の `SummaryService.monthly`。新規 DB クエリは追加せず、既に取得している `detailStatsRows`（収入エントリの日付リスト）と `legacyStatsRows` から distinct な日付を数える。

## データフロー

1. `server/modules/summary/service.ts` の `monthly`:
   - `detailStatsRows` の全日付（収入エントリがある日。deliveries / onlineMinutes の有無は問わない）と、legacy 行のうち既存フィルタ（`detailDatesWithStats` に含まれず、deliveries または onlineMinutes が正）を通過した行の日付を 1 つの `Set` に入れ、`size` を `workDays` とする。
   - `calculateMetrics` に `workDays` を渡す。
2. `server/modules/summary/metrics.ts`:
   - `MetricInput` に `workDays: number` を追加。
   - `SummaryMetrics` に `workDays: number` を追加し、そのままパススルーで返す。
3. `server/modules/summary/model.ts`:
   - `SummaryModel.Response` の `metrics` に `workDays: z.number()` を追加。

legacy 行のカウント条件を「stats が正の行のみ」とするのは、`daily_stats` に 0 や null だけの行が残っているケースを稼働日と見なさないため。収入エントリ側は金額の記録自体が稼働の証跡なので stats の有無を問わない。

## UI 仕様

`app/src/features/ledger/components/ledger-dashboard.tsx` の指標カードセクション（現在「平均時給」「1件あたり」の 2 枚、`sm:grid-cols-2`）:

- 「稼働日数」カード（`{workDays}日`）と「稼働時間」カード（`{onlineHours}時間`）を追加し、2×2 の 4 枚構成にする。グリッド定義は変更不要（`sm:grid-cols-2` のまま自然に折り返す）。
- カードの見た目は既存 2 枚と同一（`bg-[#fffdf7]`、ラベルは `text-xs tracking-widest`、数値は `font-mono text-2xl font-bold`）。数値の単位（日 / 時間）は数値と同じ行に表示する。
- 「平均時給」カードのサブテキスト「オンライン X時間」は削除する（稼働時間カードに情報が移るため）。「1件あたり」カードのサブテキスト「X件」は現状維持。
- データがない月は `0日` `0時間` と表示する（既存カードの 0 表示と同じ挙動）。

## テスト

- `server/modules/summary/metrics.test.ts`: `workDays` がパススルーで返ることを既存ケースに追加する。
- `app/src/features/ledger/components/ledger-dashboard.test.tsx`: summary fixture の `metrics` に `workDays` を追加し、「稼働日数」「稼働時間」カードの表示（値 + 単位）を検証するテストを追加する。「オンライン X時間」サブテキストを検証する既存テストはない（削除に伴うテスト修正は不要）。
- `SummaryService.monthly` の distinct カウント（収入エントリ複数件の同日重複、legacy のみの日、両方ある日の重複排除）: service には既存テストがなく DB 依存のため、既存の legacy 合算ロジックと同様に service 内インライン実装とし、専用テストは追加しない。

## エラーハンドリング

追加なし。集計元が空なら `workDays` は 0 になり、UI は `0日` を表示するだけ。
