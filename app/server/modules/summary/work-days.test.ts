import { describe, expect, it } from "vitest";
import { countWorkDays } from "./work-days";

describe("countWorkDays", () => {
  it("ゼロ件の日も含めて、稼働明細(detail)の日付を無条件でカウントする", () => {
    expect(
      countWorkDays({
        detailDates: ["2026-06-01"],
        legacyStats: [],
      }),
    ).toBe(1);
  });

  it("同じ日付がゼロ件のdetailと実績ありのlegacyの両方にある場合、1日として重複カウントしない", () => {
    expect(
      countWorkDays({
        detailDates: ["2026-06-01"],
        legacyStats: [
          { date: "2026-06-01", deliveries: 5, onlineMinutes: 120 },
        ],
      }),
    ).toBe(1);
  });

  it("legacyのみの日は実績がある場合にカウントする", () => {
    expect(
      countWorkDays({
        detailDates: [],
        legacyStats: [{ date: "2026-06-03", deliveries: 3, onlineMinutes: 60 }],
      }),
    ).toBe(1);
  });

  it("legacyのみの日は実績がゼロ/nullの場合はカウントしない", () => {
    expect(
      countWorkDays({
        detailDates: [],
        legacyStats: [
          { date: "2026-06-03", deliveries: 0, onlineMinutes: 0 },
          { date: "2026-06-04", deliveries: null, onlineMinutes: null },
        ],
      }),
    ).toBe(0);
  });

  it("入力が空の場合は0を返す", () => {
    expect(
      countWorkDays({
        detailDates: [],
        legacyStats: [],
      }),
    ).toBe(0);
  });

  it("detailとlegacyの複数の異なる日付を正しく合算する", () => {
    expect(
      countWorkDays({
        detailDates: ["2026-06-01", "2026-06-02"],
        legacyStats: [{ date: "2026-06-03", deliveries: 1, onlineMinutes: 30 }],
      }),
    ).toBe(3);
  });
});
