import { describe, expect, it } from "vitest";
import { levelFromRevenue } from "./level";

describe("levelFromRevenue", () => {
  it("売上0ならLv1のルーキー", () => {
    expect(levelFromRevenue(0)).toEqual({
      level: 1,
      title: "ルーキー",
      stage: "rookie",
      currentLevelStart: 0,
      nextLevelAt: 30000,
      progress: 0,
      remaining: 30000,
    });
  });

  it("レベル境界ちょうどで次のレベルの進捗0になる", () => {
    expect(levelFromRevenue(30000)).toMatchObject({
      level: 2,
      currentLevelStart: 30000,
      nextLevelAt: 65000,
      progress: 0,
      remaining: 35000,
    });
  });

  it("途中の進捗を割合で返す", () => {
    expect(levelFromRevenue(47500)).toMatchObject({
      level: 2,
      progress: 0.5,
      remaining: 17500,
    });
  });

  it("10レベルごとに称号とステージが変わる", () => {
    expect(levelFromRevenue(449999)).toMatchObject({
      level: 9,
      title: "ルーキー",
    });
    expect(levelFromRevenue(450000)).toMatchObject({
      level: 10,
      title: "レギュラー",
      stage: "regular",
    });
    expect(levelFromRevenue(1425000)).toMatchObject({
      level: 20,
      title: "エース",
      stage: "ace",
    });
    expect(levelFromRevenue(2900000)).toMatchObject({
      level: 30,
      title: "ベテラン",
      stage: "veteran",
    });
    expect(levelFromRevenue(4875000)).toMatchObject({
      level: 40,
      title: "レジェンド",
      stage: "legend",
    });
  });

  it("負の値はLv1として扱う", () => {
    expect(levelFromRevenue(-100)).toMatchObject({ level: 1, progress: 0 });
  });
});
