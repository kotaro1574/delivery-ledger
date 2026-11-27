import { describe, expect, it } from "vitest";
import { composeEgg, composeSlime, toRuns } from "./slime-sprite";

describe("composeSlime", () => {
  it("32x32のグリッドを返す", () => {
    const { grid } = composeSlime({ tier: 0, step: 0, gems: 0 });
    expect(grid).toHaveLength(32);
    for (const row of grid) {
      expect(row).toHaveLength(32);
    }
  });

  it("ステップに応じて装備が累積で増える", () => {
    expect(composeSlime({ tier: 0, step: 0, gems: 0 }).parts).toEqual([
      "body",
      "bag",
      "helmet",
    ]);
    expect(composeSlime({ tier: 0, step: 3, gems: 0 }).parts).toEqual([
      "body",
      "bag",
      "helmet",
      "blush",
      "star",
      "scarf",
    ]);
    expect(composeSlime({ tier: 0, step: 9, gems: 0 }).parts).toEqual([
      "aura",
      "body",
      "bag",
      "helmet",
      "blush",
      "star",
      "scarf",
      "patch",
      "goggles",
      "sparkle1",
      "sparkle2",
      "longScarf",
    ]);
  });

  it("段階ごとに乗り物が変わる", () => {
    const vehicle = (tier: 0 | 1 | 2 | 3 | 4) =>
      composeSlime({ tier, step: 0, gems: 0 }).parts.find((part) =>
        ["bicycle", "eBike", "scooter", "motorbike"].includes(part),
      );
    expect(vehicle(0)).toBeUndefined();
    expect(vehicle(1)).toBe("bicycle");
    expect(vehicle(2)).toBe("eBike");
    expect(vehicle(3)).toBe("scooter");
    expect(vehicle(4)).toBe("motorbike");
  });

  it("キングは王冠とマントを付け宝石の数だけ宝石を描く", () => {
    const king = composeSlime({ tier: 4, step: 9, gems: 2 });
    expect(king.parts).toEqual(
      expect.arrayContaining(["crown", "cape", "gem1", "gem2"]),
    );
    expect(king.parts).not.toContain("gem3");
  });

  it("段階ごとに体の色が違う", () => {
    const center = (tier: 0 | 1 | 2 | 3 | 4) => {
      const { grid } = composeSlime({ tier, step: 0, gems: 0 });
      return grid.flat().filter(Boolean);
    };
    expect(new Set(center(0))).not.toEqual(new Set(center(1)));
  });
});

describe("composeEgg", () => {
  it("たまごを描く", () => {
    expect(composeEgg().flat().some(Boolean)).toBe(true);
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

describe("紺の背景での見え方", () => {
  it("乗り物と輪郭に暗いインク色を使わない", () => {
    for (const tier of [0, 1, 2, 3, 4] as const) {
      const colors = new Set(
        composeSlime({ tier, step: 9, gems: 3 }).grid.flat(),
      );
      expect(colors.has("#22201a")).toBe(false);
      expect(colors.has("rgba(34, 32, 26, 0.12)")).toBe(false);
    }
  });
});
