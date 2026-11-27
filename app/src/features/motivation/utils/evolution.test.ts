import { describe, expect, it } from "vitest";
import { evolutionFeatures, formName } from "./evolution";

const checkpoints = [
  ...Array.from({ length: 41 }, (_, i) => i + 1),
  43,
  45,
  49,
  53,
];

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
