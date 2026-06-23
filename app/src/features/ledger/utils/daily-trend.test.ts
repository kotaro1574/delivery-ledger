import type { EntriesModel } from "@server/modules/entries/model";
import { describe, expect, it } from "vitest";
import { buildDailyTrend } from "./daily-trend";

const baseEntry = {
  id: "entry-1",
  category: "売上高",
  categoryCode: "501",
  description: "Uber売上",
  deliveries: null,
  onlineMinutes: null,
  receiptKey: null,
  privateAmount: null,
} satisfies Omit<
  EntriesModel.Item,
  "date" | "kind" | "amount" | "businessAmount"
>;

describe("buildDailyTrend", () => {
  it("月内の日ごとに売上・事業経費・利益を集計する", () => {
    const entries: EntriesModel.Item[] = [
      {
        ...baseEntry,
        id: "income-1",
        date: "2026-06-09",
        kind: "income",
        amount: 5200,
        businessAmount: null,
      },
      {
        ...baseEntry,
        id: "income-2",
        date: "2026-06-09",
        kind: "income",
        amount: 1800,
        businessAmount: null,
      },
      {
        ...baseEntry,
        id: "expense-1",
        date: "2026-06-09",
        kind: "expense",
        category: "車両費",
        categoryCode: "601",
        amount: 705,
        businessAmount: 564,
        privateAmount: 141,
      },
      {
        ...baseEntry,
        id: "income-3",
        date: "2026-06-10",
        kind: "income",
        amount: 3400,
        businessAmount: null,
      },
    ];

    const trend = buildDailyTrend("2026-06", entries);

    expect(trend.points).toHaveLength(30);
    expect(trend.points[8]).toEqual({
      date: "2026-06-09",
      label: "6/9",
      revenue: 7000,
      expense: 564,
      profit: 6436,
    });
    expect(trend.points[9]).toEqual({
      date: "2026-06-10",
      label: "6/10",
      revenue: 3400,
      expense: 0,
      profit: 3400,
    });
    expect(trend.bestProfitDay).toEqual({
      date: "2026-06-09",
      label: "6/9",
      profit: 6436,
    });
    expect(trend.averageProfit).toBe(4918);
    expect(trend.expenseRate).toBe(5);
  });
});
