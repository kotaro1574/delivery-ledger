import { describe, expect, it } from "vitest";
import { countKingMonths } from "./king-months";

describe("countKingMonths", () => {
  it("目標以上を稼いだ月だけ数える", () => {
    expect(
      countKingMonths(
        [
          { month: "2026-09", targetAmount: 300000 },
          { month: "2026-10", targetAmount: 300000 },
          { month: "2026-11", targetAmount: 300000 },
        ],
        [
          { month: "2026-09", total: 300000 },
          { month: "2026-10", total: 299999 },
          { month: "2026-08", total: 900000 },
        ],
      ),
    ).toBe(1);
  });

  it("売上がない月は達成していない", () => {
    expect(countKingMonths([{ month: "2026-11", targetAmount: 1 }], [])).toBe(
      0,
    );
  });
});
