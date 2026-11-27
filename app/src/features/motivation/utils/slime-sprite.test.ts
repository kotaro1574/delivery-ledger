import { describe, expect, it } from "vitest";
import {
  composeAppIcon,
  composeEgg,
  composeSlime,
  type PixelGrid,
  toRuns,
} from "./slime-sprite";

const checkpoints = [
  ...Array.from({ length: 41 }, (_, i) => i + 1),
  43,
  45,
  49,
  53,
];

const sameGrid = (a: PixelGrid, b: PixelGrid) =>
  JSON.stringify(a) === JSON.stringify(b);

describe("composeSlime", () => {
  it("48x48のグリッドを返す", () => {
    const { grid } = composeSlime(1);
    expect(grid).toHaveLength(48);
    expect(grid.every((row) => row.length === 48)).toBe(true);
  });

  it("隣り合うチェックポイントで見た目が違う", () => {
    for (let i = 1; i < checkpoints.length; i++) {
      expect(
        sameGrid(
          composeSlime(checkpoints[i]).grid,
          composeSlime(checkpoints[i - 1]).grid,
        ),
      ).toBe(false);
    }
  });

  it("顔のマスがほかの部品で上書きされていない", () => {
    for (const level of checkpoints) {
      const { grid, face } = composeSlime(level);
      expect(face.length).toBeGreaterThan(0);
      for (const pixel of face) {
        expect(grid[pixel.y][pixel.x]).toBe(pixel.color);
      }
    }
  });

  it("半透明の色と旧インク色を使わない", () => {
    for (const level of checkpoints) {
      const colors = new Set(composeSlime(level).grid.flat().filter(Boolean));
      for (const color of colors) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/);
      }
      expect(colors.has("#22201a")).toBe(false);
    }
  });

  it("移動手段が段階ごとに変わる", () => {
    expect(composeSlime(10).parts).not.toContain("bicycle");
    expect(composeSlime(11).parts).toContain("bicycle");
    expect(composeSlime(21).parts).toContain("scooter");
    expect(composeSlime(31).parts).toEqual(
      expect.arrayContaining(["dragon", "wings"]),
    );
  });

  it("キングは王冠を付けLv43で炎を吐き宝石が増える", () => {
    expect(composeSlime(41).parts).toContain("crown");
    expect(composeSlime(41).parts).not.toContain("fire");
    expect(composeSlime(43).parts).toContain("fire");
    expect(composeSlime(49).parts).toEqual(
      expect.arrayContaining(["gem1", "gem2"]),
    );
    expect(composeSlime(49).parts).not.toContain("gem3");
  });

  it("目標を大きく超えても描ける", () => {
    expect(composeSlime(200).parts).toEqual(
      expect.arrayContaining(["crown", "fire", "gem3"]),
    );
  });
});

describe("composeEgg", () => {
  it("48x48のたまごを描く", () => {
    const egg = composeEgg();
    expect(egg).toHaveLength(48);
    expect(egg.flat().some(Boolean)).toBe(true);
  });
});

describe("toRuns", () => {
  it("同じ色の横並びを1つにまとめる", () => {
    expect(
      toRuns([
        ["#000", "#000", null],
        [null, "#fff", "#fff"],
      ]),
    ).toEqual([
      { x: 0, y: 0, width: 2, color: "#000" },
      { x: 1, y: 1, width: 2, color: "#fff" },
    ]);
  });
});

describe("composeAppIcon", () => {
  it("28x28でキングドラゴンの王冠を描き背景の光やスピード線を入れない", () => {
    const icon = composeAppIcon();
    expect(icon).toHaveLength(28);
    expect(icon.every((row) => row.length === 28)).toBe(true);
    const colors = new Set(icon.flat());
    expect(colors.has("#ffd84a")).toBe(true);
    expect(colors.has("#2a3478")).toBe(false);
    expect(colors.has("#1f2860")).toBe(false);
    expect(colors.has("#7f88b8")).toBe(false);
  });
});
