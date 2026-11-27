# スライムがドラゴンに進化する Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 配達スライムを 48×48 で描き直し、レベルが上がるたびに形が変わって Lv31 でドラゴン、Lv41 でキングドラゴンになるようにする。

**Architecture:** レベル → 「形の特徴」（`evolutionFeatures`）を純粋関数で決め、描画関数がその特徴だけを見てグリッドに描く。描画の道具（部品ごとの輪郭付き合成、楕円・多角形・太線、色相補間）は `utils/sprite/` に分ける。`MonthlyLevel` は名前だけ新しくし、見た目はレベル数値から計算する。

**Tech Stack:** Next.js 16 / React / TypeScript / vitest + Testing Library / Biome

**Spec:** `docs/superpowers/specs/2026-11-27-slime-dragon-evolution-design.md`

## Global Constraints

- キャンバスは 48×48。SVG の `viewBox="0 0 48 48"`、`shapeRendering="crispEdges"`
- 輪郭のインク色は `#120e26`。旧インク `#22201a` と半透明色（`rgba(`）は使わない
- 名前: Lv1〜10 はいたつスライム / Lv11〜20 ツノスライム / Lv21〜30 ハネスライム / Lv31〜40 チビドラゴン / Lv41〜 キングドラゴン
- Lv1〜41 は隣り合うレベルで必ず形が変わる。Lv41 以降は Lv43（炎）、Lv45 / 49 / 53（宝石 1 / 2 / 3 個）で変わる
- 顔（目と口）は最後に描き、他の部品で隠さない
- 体の色は段階の基準色の間を色相で補間（近い側を回る）。キングは金色固定
- レベル計算（2.5% ごとに 1 レベル、`KING_LEVEL = 41`）は変えない
- CLAUDE.md: `any` 禁止、説明コメントなし、`useEffect` 極力なし
- アニメーションは既存の `slime-bob` / `rider-bounce` を `motion-safe:` で使うだけ
- 文言はひらがな中心のゲーム口調。テスト名は日本語（既存に合わせる）

## Review Focus

- Lv40 → 41 と Lv30 → 31 の切り替わりで、部品が画面外（0〜47 の外）にはみ出して欠ける
- 目のマスが翼・手・配達ボックス・炎で上書きされる
- 紺の背景（#141a3d）とほぼ同じ暗い色の部品が輪郭なしで置かれて見えなくなる
- 目標を大きく超えた月（Lv60 以上）で宝石が 3 個を超える・炎が消えるなど、表にないレベルで見た目が壊れる
- レベルアップ文言に「上がる前」の名前が入る（11 に上がったのに「はいたつスライムは」になる）

---

## File Structure

| ファイル | 役割 |
| --- | --- |
| `app/src/features/motivation/utils/monthly-level.ts`（変更） | 名前を新しくし、`step` / `gems` を消す |
| `app/src/features/motivation/utils/evolution.ts`（新規） | レベル → 形の特徴 `evolutionFeatures(level)` と名前 `formName(level)` |
| `app/src/features/motivation/utils/sprite/canvas.ts`（新規） | 48×48 グリッド、輪郭付き合成 `drawPart`、図形の道具 |
| `app/src/features/motivation/utils/sprite/color.ts`（新規） | 色相補間 `mixHue`、レベルの体色 `bodyPalette(level)` |
| `app/src/features/motivation/utils/sprite/vehicles.ts`（新規） | 自転車・スクーター・影・スピード線・配達バッグ / ボックス |
| `app/src/features/motivation/utils/sprite/slime-form.ts`（新規） | スライム形（Lv1〜30）の体・顔・帽子・ツノ・しっぽ・トゲ・翼 |
| `app/src/features/motivation/utils/sprite/dragon-form.ts`（新規） | ドラゴン形（Lv31〜）とキングの装飾・炎・宝石 |
| `app/src/features/motivation/utils/slime-sprite.ts`（書き換え） | `composeSlime(level)` / `composeEgg()` / `toRuns()` の入口 |
| `app/src/features/motivation/components/slime-character.tsx`（変更） | `composeSlime(level.level)`、viewBox 48、ラベル |
| `app/src/features/motivation/components/celebration-banner.tsx`（変更） | 新しい文言 |
| `app/src/features/motivation/components/status-panel.tsx`（変更） | 説明文の「キングドラゴン」 |

---

### Task 1: レベル → 形の特徴と名前

**Files:**
- Create: `app/src/features/motivation/utils/evolution.ts`
- Test: `app/src/features/motivation/utils/evolution.test.ts`
- Modify: `app/src/features/motivation/utils/monthly-level.ts`, `monthly-level.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Mover = "walk" | "bicycle" | "scooter" | "fly";
  export type EvolutionFeatures = {
    form: "slime" | "dragon";
    mover: Mover;
    king: boolean;
    blush: boolean;
    capStripe: boolean;
    bigBag: boolean;
    eyeShines: 1 | 2;
    bodyStage: number;
    hornLength: number;
    hornCurl: boolean;
    tailLength: number;
    tailSpike: boolean;
    backSpikes: number;
    wingSize: number;
    wingClaws: boolean;
    brows: boolean;
    snout: number;
    bellyStripes: boolean;
    fangs: boolean;
    claws: boolean;
    neck: boolean;
    sharpEyes: boolean;
    adult: boolean;
    fire: boolean;
    gems: number;
  };
  export function evolutionFeatures(level: number): EvolutionFeatures;
  export function formName(level: number): string;
  export const formNames: readonly ["はいたつスライム", "ツノスライム", "ハネスライム", "チビドラゴン", "キングドラゴン"];
  ```
- `MonthlyLevel` から `step` と `gems` を消し、`title` は `formNames[tier]` にする。`tierTitles` は消して `formNames` を使う

**特徴の決め方（spec の割り当て表をこの値に落とす）:** すべて「そのレベル以上なら」の累積。

| 特徴 | 値 |
| --- | --- |
| form | Lv31 以上 `"dragon"` |
| mover | 1〜10 walk / 11〜20 bicycle / 21〜30 scooter / 31〜 fly |
| king | 41 以上 |
| blush | 2 以上 |
| capStripe | 3 以上（帽子は walk の間だけ描く） |
| hornLength | 4→1, 6→2, 9→3, 14→4, 30→5, 36→6（それ以外は直前の値） |
| bigBag | 5 以上 |
| eyeShines | 7 以上で 2 |
| tailLength | 8→1, 12→2, 25→3, 37→4（4 はドラゴンのしっぽのトゲ） |
| bodyStage | 10 以上で 1, 40 以上で 2（40 は「大人の体つき」） |
| backSpikes | 13→1, 17→2, 23→3 |
| tailSpike | 15 以上 |
| wingSize | 16→1, 18→2, 22→3, 27→4, 35→5, 39→6 |
| hornCurl | 19 以上 |
| brows | 20 以上 |
| wingClaws | 24 以上 |
| snout | 26→1, 34→2 |
| bellyStripes | 28 以上 |
| fangs | 29 以上 |
| claws | 32 以上 |
| neck | 33 以上 |
| sharpEyes | 38 以上 |
| adult | 40 以上 |
| fire | 43 以上 |
| gems | 41 以上で `min(3, floor((level - 41) / 4))`（45→1, 49→2, 53→3） |

Lv11（mover 変化）、Lv21（mover 変化）、Lv31（form 変化）、Lv41（king）は上の表に値の変化がなくても mover / form / king で必ず差が出る。

- [ ] **Step 1: 失敗するテストを書く** `evolution.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { evolutionFeatures, formName } from "./evolution";

const checkpoints = [...Array.from({ length: 41 }, (_, i) => i + 1), 43, 45, 49, 53];

describe("evolutionFeatures", () => {
  it("Lv1〜41と43・45・49・53は前のチェックポイントと形の特徴が違う", () => {
    for (let i = 1; i < checkpoints.length; i++) {
      expect(evolutionFeatures(checkpoints[i])).not.toEqual(
        evolutionFeatures(checkpoints[i - 1]),
      );
    }
  });

  it("10レベルごとに移動手段が変わる", () => {
    expect(evolutionFeatures(10).mover).toBe("walk");
    expect(evolutionFeatures(11).mover).toBe("bicycle");
    expect(evolutionFeatures(21).mover).toBe("scooter");
    expect(evolutionFeatures(31).mover).toBe("fly");
  });

  it("Lv31でドラゴンになりLv41でキングになる", () => {
    expect(evolutionFeatures(30).form).toBe("slime");
    expect(evolutionFeatures(31).form).toBe("dragon");
    expect(evolutionFeatures(40).king).toBe(false);
    expect(evolutionFeatures(41).king).toBe(true);
  });

  it("キングはLv43で炎を吐き宝石は最大3つ", () => {
    expect(evolutionFeatures(42).fire).toBe(false);
    expect(evolutionFeatures(43).fire).toBe(true);
    expect(evolutionFeatures(45).gems).toBe(1);
    expect(evolutionFeatures(53).gems).toBe(3);
    expect(evolutionFeatures(120).gems).toBe(3);
    expect(evolutionFeatures(120).fire).toBe(true);
  });
});

describe("formName", () => {
  it("段階ごとの名前を返す", () => {
    expect(formName(1)).toBe("はいたつスライム");
    expect(formName(11)).toBe("ツノスライム");
    expect(formName(21)).toBe("ハネスライム");
    expect(formName(31)).toBe("チビドラゴン");
    expect(formName(41)).toBe("キングドラゴン");
    expect(formName(99)).toBe("キングドラゴン");
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `cd app && npx vitest run src/features/motivation/utils/evolution.test.ts`
Expected: FAIL（`./evolution` が見つからない）

- [ ] **Step 3: `evolution.ts` を実装** — 上の表のしきい値を `stage(level, [[4,1],[6,2],...])` のような「しきい値配列から最後に超えた値を返す」小さな関数で表す

- [ ] **Step 4: `monthly-level.test.ts` を新しい形に更新して失敗を確認**

`title` の期待値を `"はいたつスライム"` / `"ハネスライム"`（Lv25）/ `"キングドラゴン"` に変え、`step` / `gems` の期待を消す。宝石のテスト（`目標超過10%ごとに王冠の宝石が増え最大3つ`）は `evolution.test.ts` に移ったので消す。
Run: `cd app && npx vitest run src/features/motivation/utils/monthly-level.test.ts`
Expected: FAIL（title が旧名）

- [ ] **Step 5: `monthly-level.ts` を更新** — `title: formNames[tier]`、`step` / `gems` / `tierTitles` を削除

- [ ] **Step 6: 2 つのテストが通ることを確認**

Run: `cd app && npx vitest run src/features/motivation/utils/evolution.test.ts src/features/motivation/utils/monthly-level.test.ts`
Expected: PASS（この時点で `slime-character.tsx` は `level.step` を参照していて tsc は落ちる。Task 4 で直す）

- [ ] **Step 7: コミット**

```bash
git add app/src/features/motivation/utils/evolution.ts app/src/features/motivation/utils/evolution.test.ts app/src/features/motivation/utils/monthly-level.ts app/src/features/motivation/utils/monthly-level.test.ts
git commit -m "feat: derive slime evolution features from monthly level"
```

---

### Task 2: 描画の道具と色

**Files:**
- Create: `app/src/features/motivation/utils/sprite/canvas.ts`, `sprite/color.ts`
- Test: `app/src/features/motivation/utils/sprite/canvas.test.ts`, `sprite/color.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const SIZE = 48;
  export const INK = "#120e26";
  export type PixelGrid = (string | null)[][];
  export type Put = (x: number, y: number, color: string) => void;
  export function createGrid(): PixelGrid;
  export function drawPart(grid: PixelGrid, draw: (put: Put) => void, options?: { outline?: boolean }): void;
  export function fillEllipse(put: Put, cx: number, cy: number, rx: number, ry: number, color: (nx: number, ny: number, x: number, y: number) => string | null): void;
  export function fillRect(put: Put, x: number, y: number, width: number, height: number, color: string): void;
  export function thickLine(put: Put, from: [number, number], to: [number, number], width: number, color: string): void;
  export function fillPolygon(put: Put, points: [number, number][], color: (x: number, y: number) => string): void;

  export type BodyPalette = { hi: string; base: string; mid: string; dark: string; spec: string };
  export function mixHue(from: string, to: string, t: number): string;
  export function bodyPalette(level: number): BodyPalette;
  ```
- `drawPart`: 一時グリッドに描き、`outline` が既定の `true` なら、描いたマスに上下左右で接する空きマスを `INK` にして本体グリッドへ重ねる（お試しの `part` と同じ）。座標は `Math.round` して 0〜47 の外は捨てる
- `bodyPalette`: 基準色は緑 `#7fd36a` 系（Lv1）→ 青 `#62b8f0` 系（Lv11）→ 紫 `#a87ce8` 系（Lv21）→ オレンジ `#ffa24a` 系（Lv31〜40）。キング（41〜）は金 `{ hi: "#fff6c8", base: "#ffd24a", mid: "#e8a630", dark: "#b07420", spec: "#fffdf0" }`。5 トーンの正確な値は実装者が紺の上で見て決める

- [ ] **Step 1: 失敗するテストを書く**

`canvas.test.ts`:
```ts
it("drawPartは描いた部品の外側をインク色で囲む", () => {
  const grid = createGrid();
  drawPart(grid, (put) => put(10, 10, "#ffffff"));
  expect(grid[10][10]).toBe("#ffffff");
  expect(grid[9][10]).toBe(INK);
  expect(grid[10][11]).toBe(INK);
  expect(grid[9][9]).toBeNull();
});
it("outline: falseなら輪郭を付けない", () => { /* grid[9][10] が null */ });
it("キャンバスの外の点は捨てる", () => { /* put(-1, 50, ...) で例外なし・グリッド全部 null */ });
```

`color.test.ts`:
```ts
it("色相の近い側を回って補間する", () => {
  const mid = mixHue("#a87ce8", "#ffa24a", 0.5);
  const [r, g, b] = [1, 3, 5].map((k) => parseInt(mid.slice(k, k + 2), 16));
  expect(r).toBeGreaterThan(g);
  expect(r).toBeGreaterThan(b);
});
it("レベルごとに体の色が変わる", () => {
  for (let level = 2; level <= 41; level++) {
    expect(bodyPalette(level).base).not.toBe(bodyPalette(level - 1).base);
  }
});
it("キングは金色で固定", () => {
  expect(bodyPalette(41)).toEqual(bodyPalette(80));
});
it("半透明の色を返さない", () => {
  for (let level = 1; level <= 53; level++) {
    expect(Object.values(bodyPalette(level)).every((c) => /^#[0-9a-f]{6}$/.test(c))).toBe(true);
  }
});
```

- [ ] **Step 2: 失敗を確認** — Run: `cd app && npx vitest run src/features/motivation/utils/sprite` / Expected: FAIL（モジュールなし）
- [ ] **Step 3: `canvas.ts` と `color.ts` を実装**（`mixHue` は HSL に変換して色相差を ±180 に収めて補間）
- [ ] **Step 4: 通ることを確認** — 同じコマンド / Expected: PASS
- [ ] **Step 5: コミット** — `git commit -m "feat: add 48px sprite canvas helpers and hue-blended body colors"`

---

### Task 3: スライム形・ドラゴン形・乗り物を描く

**Files:**
- Create: `sprite/vehicles.ts`, `sprite/slime-form.ts`, `sprite/dragon-form.ts`
- Rewrite: `app/src/features/motivation/utils/slime-sprite.ts`
- Rewrite test: `app/src/features/motivation/utils/slime-sprite.test.ts`

**Interfaces:**
- Consumes: Task 1 `evolutionFeatures`、Task 2 の全部
- Produces:
  ```ts
  export type FacePixel = { x: number; y: number; color: string };
  export function drawSlimeForm(grid: PixelGrid, features: EvolutionFeatures, palette: BodyPalette): FacePixel[];
  export function drawDragonForm(grid: PixelGrid, features: EvolutionFeatures, palette: BodyPalette): FacePixel[];
  export function composeSlime(level: number): { grid: PixelGrid; parts: string[]; face: FacePixel[] };
  export function composeEgg(): PixelGrid;
  export function toRuns(grid: PixelGrid): PixelRun[];
  ```
- `drawSlimeForm` / `drawDragonForm` は顔のマスを最後に描き、そのマスを `FacePixel[]` で返す
- `parts` は描いた部品名（`"body"`, `"cap"`, `"horns"`, `"tail"`, `"wings"`, `"bicycle"`, `"scooter"`, `"crown"`, `"fire"`, `"gem1"`…）。テストで部品の有無を見るために使う
- 描き方の参考は spec の「デザインの決めごと」。位置の目安（お試しで決めた値）:
  - 徒歩: 体の中心 x24・底 y45、帽子は体の上 4 割、バッグは体の左
  - 自転車: 車輪 (12,39)(36,39) 半径 6.5、体の中心 x20・底 y32、配達バッグは前かご (35,24)
  - スクーター: 車輪 (13,41)(36,41) 半径 4.5、体の中心 x19・底 y31、配達ボックスは後ろの荷台 (1,20)
  - ドラゴン: 体 (22,30)、頭 (31〜32, 18〜19)、`adult` が false の間は頭と体を大きく丸く、`neck` / `snout` / `wingSize` / `adult` で形を伸ばす。キングは全体を 1.05 倍、光の背景（中心 (24,24)、半径 9〜26 の放射状の 16 分割を 1 つおきに `#2a3478` / `#1f2860`）、翼 2 枚、胸の宝石、王冠
  - 炎: 口の先から右へ 6 マスの三角形（白 → 金 → 外側 `#ff6a3a`）

- [ ] **Step 1: 失敗するテストを書く**（旧テストは全部置き換える）

```ts
const checkpoints = [...Array.from({ length: 41 }, (_, i) => i + 1), 43, 45, 49, 53];
const sameGrid = (a: PixelGrid, b: PixelGrid) => JSON.stringify(a) === JSON.stringify(b);

it("48x48のグリッドを返す", () => { /* composeSlime(1).grid が 48 行 × 48 列 */ });

it("隣り合うチェックポイントで見た目が違う", () => {
  for (let i = 1; i < checkpoints.length; i++) {
    expect(sameGrid(composeSlime(checkpoints[i]).grid, composeSlime(checkpoints[i - 1]).grid)).toBe(false);
  }
});

it("顔のマスがほかの部品で上書きされていない", () => {
  for (const level of checkpoints) {
    const { grid, face } = composeSlime(level);
    expect(face.length).toBeGreaterThan(0);
    for (const pixel of face) expect(grid[pixel.y][pixel.x]).toBe(pixel.color);
  }
});

it("半透明の色と旧インク色を使わない", () => {
  for (const level of checkpoints) {
    const colors = new Set(composeSlime(level).grid.flat().filter(Boolean));
    for (const color of colors) expect(color).toMatch(/^#[0-9a-f]{6}$/);
    expect(colors.has("#22201a")).toBe(false);
  }
});

it("移動手段が段階ごとに変わる", () => {
  expect(composeSlime(10).parts).not.toContain("bicycle");
  expect(composeSlime(11).parts).toContain("bicycle");
  expect(composeSlime(21).parts).toContain("scooter");
  expect(composeSlime(31).parts).toEqual(expect.arrayContaining(["dragon", "wings"]));
});

it("キングは王冠を付けLv43で炎を吐き宝石が増える", () => {
  expect(composeSlime(41).parts).toEqual(expect.arrayContaining(["crown"]));
  expect(composeSlime(41).parts).not.toContain("fire");
  expect(composeSlime(43).parts).toContain("fire");
  expect(composeSlime(49).parts).toEqual(expect.arrayContaining(["gem1", "gem2"]));
  expect(composeSlime(49).parts).not.toContain("gem3");
});

it("目標を大きく超えても描ける", () => {
  expect(composeSlime(200).parts).toEqual(expect.arrayContaining(["crown", "fire", "gem3"]));
});
```
`composeEgg` と `toRuns` の既存テストは残す（`composeEgg` は 48 行になる）。

- [ ] **Step 2: 失敗を確認** — Run: `cd app && npx vitest run src/features/motivation/utils/slime-sprite.test.ts` / Expected: FAIL
- [ ] **Step 3: `vehicles.ts` → `slime-form.ts` → `dragon-form.ts` → `slime-sprite.ts` の順に実装**
- [ ] **Step 4: 通ることを確認** — 同じコマンド / Expected: PASS
- [ ] **Step 5: 全レベルのシートを作って目で確認**

scratchpad に Lv1〜53 を 8 列で並べた PNG を出すスクリプトを書き（`composeSlime` を import して描く。リポジトリには入れない）、次を目で確認する。直したら Step 4 に戻る。
- 隣のレベルとの違いが見える
- 顔が隠れていない、部品がキャンバスの端で切れていない
- 紺の上で輪郭が分かる
- Lv30 → 31 が丸いまま自然につながる、Lv41 が派手

- [ ] **Step 6: コミット** — `git commit -m "feat: draw slime evolving into a dragon level by level at 48px"`

---

### Task 4: 画面につなぐ（キャラ・ステータス・お祝い）

**Files:**
- Modify: `components/slime-character.tsx`, `components/status-panel.tsx`, `components/celebration-banner.tsx`
- Test: `components/status-panel.test.tsx`, `components/celebration-banner.test.tsx`

**Interfaces:**
- Consumes: `composeSlime(level: number)`, `formName(level: number)`, `MonthlyLevel.title`

**文言（spec どおり）:**
- レベルアップ: `{formName(after.level)}は レベル{after.level}に あがった！`
- 進化（キング以外で tier が変わった）: `{formName(before.level)}は {formName(after.level)}に しんかした！`
- キング誕生: `もくひょうたっせい！ キングドラゴンが たんじょうした！`
- ステータスの説明: `もくひょうの 2.5% を かせぐごとに 1レベル。100% で キングドラゴン`
- キャラのラベル: `Lv.{level} {formName(level)}`（たまごは `スライムのたまご` のまま）

- [ ] **Step 1: テストを新しい文言に更新して失敗を確認**

`celebration-banner.test.tsx`:
- `"スライムは レベル25に あがった！"` → `"ハネスライムは レベル25に あがった！"`
- `"スライムは レベル21に あがった！"` → `"ハネスライムは レベル21に あがった！"`、`"エースに しんかした！"` → `"ツノスライムは ハネスライムに しんかした！"`
- `"もくひょうたっせい！ スライムキングが たんじょうした！"` → `"もくひょうたっせい！ キングドラゴンが たんじょうした！"`、テスト名の「スライムキング」も「キングドラゴン」に

`status-panel.test.tsx`:
- `"エース"` → `"ハネスライム"`、`"Lv.25 エースの はいたつスライム"` → `"Lv.25 ハネスライム"`
- キングの月のテスト: `getByText("キング")` → `getByText("キングドラゴン")`
- 説明文を確認するテストを足す: 目標なしで `"もくひょうの 2.5% を かせぐごとに 1レベル。100% で キングドラゴン"` が出る（今の文言は改行を含む JSX なので、1 つのテキストノードにする）

Run: `cd app && npx vitest run src/features/motivation/components`
Expected: FAIL（旧文言）

- [ ] **Step 2: 3 つのコンポーネントを更新** — `slime-character.tsx` は `composeSlime(level.level).grid`、`viewBox="0 0 48 48"`
- [ ] **Step 3: 通ることを確認** — 同じコマンド / Expected: PASS
- [ ] **Step 4: 全体チェック**

Run: `cd app && npx vitest run && npx tsc --noEmit && npx biome check`
Expected: 全部成功

- [ ] **Step 5: Browser pane で確認（375px）**

ローカルの dev サーバー（`.claude/launch.json` の設定）でログインし、次を確認する。
- 目標あり（Lv5 前後・Lv25 前後・キング）のステータス欄のキャラ
- `?gained=` でレベルアップ、進化（Lv20 → 21 をまたぐ額）、キング誕生のバナー
- 目標なしのたまご

- [ ] **Step 6: コミット** — `git commit -m "feat: show dragon evolution names in status and celebration"`
