import { describe, expect, it } from "vitest";
import { SummaryModel } from "./model";

describe("SummaryModel", () => {
  it("事業分経費と支払総額を区別して返す", () => {
    expect(
      SummaryModel.Response.parse({
        revenue: 65559,
        expense: 564,
        paidExpense: 705,
        profit: 64995,
        byCategory: [{ code: "601", name: "車両費", amount: 564 }],
        metrics: {
          wagePerHour: 0,
          perDelivery: 0,
          deliveries: 0,
          onlineHours: 0,
          workDays: 0,
        },
      }),
    ).toEqual({
      revenue: 65559,
      expense: 564,
      paidExpense: 705,
      profit: 64995,
      byCategory: [{ code: "601", name: "車両費", amount: 564 }],
      metrics: {
        wagePerHour: 0,
        perDelivery: 0,
        deliveries: 0,
        onlineHours: 0,
        workDays: 0,
      },
    });
  });

  it("年次集計を返す", () => {
    expect(
      SummaryModel.YearlyResponse.parse({
        year: "2026",
        revenue: 155_559,
        expense: 10_564,
        paidExpense: 12_705,
        profit: 144_995,
        profitRate: 93,
        monthly: [
          {
            month: "2026-06",
            label: "6月",
            revenue: 65_559,
            expense: 564,
            paidExpense: 705,
            profit: 64_995,
            profitRate: 99,
          },
        ],
        byCategory: [{ code: "601", name: "車両費", amount: 10_564 }],
      }),
    ).toEqual({
      year: "2026",
      revenue: 155_559,
      expense: 10_564,
      paidExpense: 12_705,
      profit: 144_995,
      profitRate: 93,
      monthly: [
        {
          month: "2026-06",
          label: "6月",
          revenue: 65_559,
          expense: 564,
          paidExpense: 705,
          profit: 64_995,
          profitRate: 99,
        },
      ],
      byCategory: [{ code: "601", name: "車両費", amount: 10_564 }],
    });
  });
});
