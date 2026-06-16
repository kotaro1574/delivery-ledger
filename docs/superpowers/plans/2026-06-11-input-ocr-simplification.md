# Input OCR Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 入力画面をシンプルにし、経費は手動入力とGemini OCR入力の両方を使えるようにする。

**Architecture:** プリセットUIと収入レシートUIを`EntryInputForm`から削除する。OCRは`POST /api/receipts/analyze`で同期実行し、サーバー側でGemini Developer APIを直接呼び、結果を既存の勘定科目コードへ正規化する。

**Tech Stack:** Next.js App Router, Hono, Zod, Gemini Developer API REST, Vitest, Testing Library

---

### Task 1: UIの期待値テスト

**Files:**
- Modify: `app/src/features/entries/components/entry-input-form.test.tsx`

- [ ] プリセットボタンが表示されないテストを追加する。
- [ ] 収入モードでレシート入力が表示されないテストを追加する。
- [ ] 経費モードで手動入力保存ができるテストを追加する。
- [ ] 経費モードでOCR結果が金額・カテゴリ・メモへ反映されるテストを追加する。
- [ ] `vitest run app/src/features/entries/components/entry-input-form.test.tsx`でREDを確認する。

### Task 2: OCRカテゴリ分類テスト

**Files:**
- Create: `app/server/modules/receipts/ocr.test.ts`
- Create: `app/server/modules/receipts/ocr.ts`

- [ ] `ENEOS`や`ガソリン`を車両費へ分類するテストを追加する。
- [ ] `スマホ`や`SIM`を通信費へ分類するテストを追加する。
- [ ] 判定不能を雑費へ分類するテストを追加する。
- [ ] `vitest run app/server/modules/receipts/ocr.test.ts`でREDを確認する。

### Task 3: OCR API実装

**Files:**
- Modify: `app/src/env.d.ts`
- Modify: `app/wrangler.jsonc`
- Modify: `app/server/modules/receipts/model.ts`
- Modify: `app/server/modules/receipts/service.ts`
- Modify: `app/server/modules/receipts/index.ts`
- Modify: `app/server/modules/receipts/ocr.ts`

- [ ] `GEMINI_API_KEY`と任意の`GEMINI_OCR_MODEL`をCloudflareEnvへ追加する。
- [ ] Gemini REST payloadを作る。
- [ ] `generationConfig.responseFormat`でJSON schemaを指定する。
- [ ] レスポンスJSONをZodで検証する。
- [ ] OCR結果を`amount/date/storeName/categoryCode/memo/confidence`へ変換する。
- [ ] `POST /api/receipts/analyze`を追加する。
- [ ] OCR未設定時は400系エラーで手動入力に戻れるメッセージを返す。

### Task 4: 入力フォーム実装

**Files:**
- Modify: `app/src/features/entries/components/entry-input-form.tsx`

- [ ] `presets`と`applyPreset`を削除する。
- [ ] 収入モードではレシート入力を非表示にする。
- [ ] 経費モードに手動入力のカテゴリ選択とOCRファイル入力を表示する。
- [ ] OCR中はボタンをdisabledにしてローディング表示する。
- [ ] OCR成功時に金額、稼働日、カテゴリ、メモを反映する。
- [ ] OCR失敗時はtoastを表示し、手動入力を維持する。

### Task 5: 検証

**Files:**
- No direct file edits.

- [ ] `vitest run`を実行する。
- [ ] `biome check`を実行する。
- [ ] `tsc --noEmit`を実行する。
- [ ] `npm run build`を実行する。
- [ ] ローカルpreviewを起動し、ブラウザで収入手入力と経費手入力/OCR UIを確認する。
