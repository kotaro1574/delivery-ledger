import { describe, expect, it } from "vitest";
import { buildDailyStats } from "./daily-stats";

describe("buildDailyStats", () => {
  it("同じ日の明細の配達件数と稼働時間を合算して日付順に返す", () => {
    expect(
      buildDailyStats({
        detailRows: [
          { date: "2026-06-09", deliveries: 8, onlineMinutes: 240 },
          { date: "2026-06-02", deliveries: 3, onlineMinutes: 90 },
          { date: "2026-06-09", deliveries: 4, onlineMinutes: null },
        ],
        legacyRows: [],
      }),
    ).toEqual([
      { date: "2026-06-02", deliveries: 3, onlineMinutes: 90 },
      { date: "2026-06-09", deliveries: 12, onlineMinutes: 240 },
    ]);
  });

  it("明細に実績がある日は旧データを使わず、ない日は旧データを使う", () => {
    expect(
      buildDailyStats({
        detailRows: [
          { date: "2026-06-01", deliveries: 5, onlineMinutes: 120 },
          { date: "2026-06-03", deliveries: 0, onlineMinutes: 0 },
        ],
        legacyRows: [
          { date: "2026-06-01", deliveries: 99, onlineMinutes: 999 },
          { date: "2026-06-03", deliveries: 6, onlineMinutes: 180 },
          { date: "2026-06-04", deliveries: null, onlineMinutes: null },
        ],
      }),
    ).toEqual([
      { date: "2026-06-01", deliveries: 5, onlineMinutes: 120 },
      { date: "2026-06-03", deliveries: 6, onlineMinutes: 180 },
    ]);
  });
});
