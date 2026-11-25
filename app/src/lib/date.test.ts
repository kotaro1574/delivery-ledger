import { describe, expect, it } from "vitest";
import { tokyoDateString } from "./date";

describe("tokyoDateString", () => {
  it("UTCの前日夜でも日本時間の日付を返す", () => {
    expect(tokyoDateString(new Date("2026-11-30T16:00:00Z"))).toBe(
      "2026-12-01",
    );
  });

  it("日本時間の深夜0時前は当日のまま", () => {
    expect(tokyoDateString(new Date("2026-11-30T14:59:00Z"))).toBe(
      "2026-11-30",
    );
  });
});
