import { describe, expect, it } from "vitest";
import { goalProgress } from "./goal-progress";

const today = new Date(2026, 10, 25);

describe("goalProgress", () => {
  it("目標がない月はnull", () => {
    expect(
      goalProgress({ month: "2026-11", revenue: 1000, goal: null, today }),
    ).toBeNull();
  });

  it("今月は残り日数と1日ペースを返す", () => {
    expect(
      goalProgress({ month: "2026-11", revenue: 186000, goal: 300000, today }),
    ).toEqual({
      goal: 300000,
      rate: 0.62,
      remaining: 114000,
      overAmount: 0,
      achieved: false,
      timing: "current",
      daysLeft: 6,
      dailyPace: 19000,
    });
  });

  it("1日ペースは切り上げる", () => {
    expect(
      goalProgress({ month: "2026-11", revenue: 0, goal: 100000, today }),
    ).toMatchObject({ daysLeft: 6, dailyPace: 16667 });
  });

  it("目標超過は達成率100%で頭打ちにして超過額を返す", () => {
    expect(
      goalProgress({ month: "2026-11", revenue: 320000, goal: 300000, today }),
    ).toMatchObject({
      rate: 1,
      remaining: 0,
      overAmount: 20000,
      achieved: true,
      dailyPace: null,
    });
  });

  it("過去月はペースを出さない", () => {
    expect(
      goalProgress({ month: "2026-10", revenue: 100000, goal: 300000, today }),
    ).toMatchObject({
      timing: "past",
      achieved: false,
      daysLeft: null,
      dailyPace: null,
    });
  });

  it("未来月はfuture扱いでペースを出さない", () => {
    expect(
      goalProgress({ month: "2027-01", revenue: 0, goal: 300000, today }),
    ).toMatchObject({ timing: "future", daysLeft: null, dailyPace: null });
  });
});
