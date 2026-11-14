import type { EntriesModel } from "@server/modules/entries/model";
import { describe, expect, it } from "vitest";
import {
  buildAmountAxis,
  buildDailyTrend,
  buildProfitSegments,
  compactAmount,
} from "./daily-trend";

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
      day: 9,
      weekday: 2,
      weekdayLabel: "火",
      revenue: 7000,
      expense: 564,
      profit: 6436,
    });
    expect(trend.points[9]).toEqual({
      date: "2026-06-10",
      label: "6/10",
      day: 10,
      weekday: 3,
      weekdayLabel: "水",
      revenue: 3400,
      expense: 0,
      profit: 3400,
    });
    expect(trend.bestProfitDay).toEqual({
      date: "2026-06-09",
      label: "6/9",
      weekdayLabel: "火",
      profit: 6436,
    });
    expect(trend.averageProfit).toBe(4918);
    expect(trend.expenseRate).toBe(5);
  });

  it("各日に曜日を付ける", () => {
    const november = buildDailyTrend("2026-11", []);

    expect(
      november.points.slice(0, 9).map((point) => point.weekdayLabel),
    ).toEqual(["日", "月", "火", "水", "木", "金", "土", "日", "月"]);
    expect(november.points[13]).toMatchObject({
      date: "2026-11-14",
      day: 14,
      weekday: 6,
      weekdayLabel: "土",
    });

    const leapFebruary = buildDailyTrend("2028-02", []);

    expect(leapFebruary.points).toHaveLength(29);
    expect(leapFebruary.points[28]).toMatchObject({
      day: 29,
      weekdayLabel: "火",
    });
  });
});

describe("buildAmountAxis", () => {
  it("最大値をきりのいい金額に切り上げて目盛りを作る", () => {
    expect(buildAmountAxis([6777, 4500, 953])).toEqual({
      min: 0,
      max: 8000,
      ticks: [0, 2000, 4000, 6000, 8000],
    });
    expect(buildAmountAxis([23400])).toEqual({
      min: 0,
      max: 30000,
      ticks: [0, 10000, 20000, 30000],
    });
  });

  it("赤字の日があれば 0 より下にも目盛りを伸ばす", () => {
    const axis = buildAmountAxis([7000, -1200]);

    expect(axis.min).toBeLessThanOrEqual(-1200);
    expect(axis.max).toBeGreaterThanOrEqual(7000);
    expect(axis.ticks).toContain(0);
    expect(axis.ticks[0]).toBe(axis.min);
    expect(axis.ticks.at(-1)).toBe(axis.max);
  });

  it("データが無くても目盛りを返す", () => {
    expect(buildAmountAxis([])).toEqual({
      min: 0,
      max: 1000,
      ticks: [0, 500, 1000],
    });
  });
});

describe("compactAmount", () => {
  it("1万円以上は万単位に丸める", () => {
    expect(compactAmount(0)).toBe("0");
    expect(compactAmount(8000)).toBe("8,000");
    expect(compactAmount(10000)).toBe("1万");
    expect(compactAmount(25000)).toBe("2.5万");
    expect(compactAmount(-2000)).toBe("-2,000");
  });
});

describe("buildProfitSegments", () => {
  it("稼働日どうしだけを結び、休みをまたぐ区間に印を付ける", () => {
    const trend = buildDailyTrend("2026-06", [
      {
        ...baseEntry,
        id: "a",
        date: "2026-06-09",
        kind: "income",
        amount: 5000,
        businessAmount: null,
      },
      {
        ...baseEntry,
        id: "b",
        date: "2026-06-10",
        kind: "income",
        amount: 3000,
        businessAmount: null,
      },
      {
        ...baseEntry,
        id: "c",
        date: "2026-06-13",
        kind: "income",
        amount: 4000,
        businessAmount: null,
      },
    ]);

    expect(buildProfitSegments(trend.points)).toEqual([
      { from: 8, to: 9, bridgesRestDays: false },
      { from: 9, to: 12, bridgesRestDays: true },
    ]);
    expect(buildProfitSegments(buildDailyTrend("2026-06", []).points)).toEqual(
      [],
    );
  });
});
