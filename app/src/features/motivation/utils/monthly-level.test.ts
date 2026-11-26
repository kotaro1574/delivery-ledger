import { describe, expect, it } from "vitest";
import { monthlyLevel } from "./monthly-level";

describe("monthlyLevel", () => {
  it("目標がなければnull", () => {
    expect(monthlyLevel(100000, null)).toBeNull();
  });

  it("売上0はLv1のルーキー", () => {
    expect(monthlyLevel(0, 300000)).toEqual({
      level: 1,
      tier: 0,
      title: "ルーキー",
      step: 0,
      gems: 0,
      currentLevelStart: 0,
      nextLevelAt: 7500,
      remaining: 7500,
      progress: 0,
    });
  });

  it("達成率2.5%ごとに1レベル上がる", () => {
    expect(monthlyLevel(186000, 300000)).toMatchObject({
      level: 25,
      tier: 2,
      title: "エース",
      step: 4,
      nextLevelAt: 187500,
      remaining: 1500,
    });
  });

  it("97.5%はベテランの最終ステップ", () => {
    expect(monthlyLevel(292500, 300000)).toMatchObject({
      level: 40,
      tier: 3,
      step: 9,
    });
  });

  it("100%でLv41のキングになり全装備", () => {
    expect(monthlyLevel(300000, 300000)).toMatchObject({
      level: 41,
      tier: 4,
      title: "キング",
      step: 9,
      gems: 0,
    });
  });

  it("目標超過10%ごとに王冠の宝石が増え最大3つ", () => {
    expect(monthlyLevel(330000, 300000)).toMatchObject({ level: 45, gems: 1 });
    expect(monthlyLevel(600000, 300000)).toMatchObject({ gems: 3 });
  });

  it("割り切れない目標でも次Lvまでの額は切り上げ", () => {
    expect(monthlyLevel(0, 100001)).toMatchObject({
      nextLevelAt: 2501,
      remaining: 2501,
    });
  });
});
