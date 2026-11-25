import { describe, expect, it } from "vitest";
import { GoalsModel } from "./model";

describe("GoalsModel", () => {
  it("正の整数の目標金額を受け付ける", () => {
    expect(GoalsModel.UpsertRequest.parse({ targetAmount: 300000 })).toEqual({
      targetAmount: 300000,
    });
  });

  it.each([0, -1, 1.5, 100_000_001])("不正な目標金額 %s を弾く", (value) => {
    expect(
      GoalsModel.UpsertRequest.safeParse({ targetAmount: value }).success,
    ).toBe(false);
  });

  it("YYYY-MM形式の月だけ受け付ける", () => {
    expect(GoalsModel.MonthParam.safeParse({ month: "2026-11" }).success).toBe(
      true,
    );
    expect(GoalsModel.MonthParam.safeParse({ month: "2026-1" }).success).toBe(
      false,
    );
  });
});
