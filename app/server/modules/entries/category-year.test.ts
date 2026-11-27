import { describe, expect, it } from "vitest";
import { summarizeCategoryYear } from "./category-year";
import type { EntriesModel } from "./model";

const expense = (
  overrides: Pick<
    EntriesModel.Item,
    "id" | "date" | "amount" | "businessAmount" | "privateAmount"
  >,
): EntriesModel.Item => ({
  kind: "expense",
  category: "車両費",
  categoryCode: "601",
  description: "ガソリン",
  deliveries: null,
  onlineMinutes: null,
  receiptKey: null,
  ...overrides,
});

describe("summarizeCategoryYear", () => {
  it("事業分と支払額を別々に合計する", () => {
    expect(
      summarizeCategoryYear([
        expense({
          id: "a",
          date: "2026-03-02",
          amount: 1000,
          businessAmount: 800,
          privateAmount: 200,
        }),
        expense({
          id: "b",
          date: "2026-03-20",
          amount: 500,
          businessAmount: 500,
          privateAmount: 0,
        }),
      ]),
    ).toMatchObject({ business: 1300, paid: 1500 });
  });

  it("月ごとの事業分を12か月に振り分ける", () => {
    const { months } = summarizeCategoryYear([
      expense({
        id: "a",
        date: "2026-01-31",
        amount: 700,
        businessAmount: 700,
        privateAmount: 0,
      }),
      expense({
        id: "b",
        date: "2026-12-01",
        amount: 900,
        businessAmount: 600,
        privateAmount: 300,
      }),
    ]);
    expect(months).toHaveLength(12);
    expect(months[0]).toBe(700);
    expect(months[11]).toBe(600);
    expect(months.slice(1, 11).every((value) => value === 0)).toBe(true);
  });

  it("明細がなければすべて0", () => {
    expect(summarizeCategoryYear([])).toEqual({
      business: 0,
      paid: 0,
      months: Array.from({ length: 12 }, () => 0),
    });
  });
});
