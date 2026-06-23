import { describe, expect, it } from "vitest";
import { buildYearlySummary } from "./yearly";

describe("buildYearlySummary", () => {
  it("年内12ヶ月の売上・事業経費・利益・利益率を集計する", () => {
    const summary = buildYearlySummary({
      year: "2026",
      revenue: [
        { month: "2026-06", total: 65_559 },
        { month: "2026-07", total: 90_000 },
      ],
      expense: [
        { month: "2026-06", total: 564 },
        { month: "2026-07", total: 10_000 },
      ],
      paidExpense: [
        { month: "2026-06", total: 705 },
        { month: "2026-07", total: 12_000 },
      ],
      byCategory: [
        { code: "602", name: "通信費", amount: 2_000 },
        { code: "601", name: "車両費", amount: 8_564 },
      ],
    });

    expect(summary.revenue).toBe(155_559);
    expect(summary.expense).toBe(10_564);
    expect(summary.paidExpense).toBe(12_705);
    expect(summary.profit).toBe(144_995);
    expect(summary.profitRate).toBe(93);
    expect(summary.monthly).toHaveLength(12);
    expect(summary.monthly[0]).toEqual({
      month: "2026-01",
      label: "1月",
      revenue: 0,
      expense: 0,
      paidExpense: 0,
      profit: 0,
      profitRate: 0,
    });
    expect(summary.monthly[5]).toEqual({
      month: "2026-06",
      label: "6月",
      revenue: 65_559,
      expense: 564,
      paidExpense: 705,
      profit: 64_995,
      profitRate: 99,
    });
    expect(summary.byCategory).toEqual([
      { code: "601", name: "車両費", amount: 8_564 },
      { code: "602", name: "通信費", amount: 2_000 },
    ]);
  });
});
