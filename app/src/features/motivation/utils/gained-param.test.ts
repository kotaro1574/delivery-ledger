import { describe, expect, it } from "vitest";
import { parseGained } from "./gained-param";

describe("parseGained", () => {
  it("累計売上以下の正の整数だけ受け付ける", () => {
    expect(parseGained("12000", 612400)).toBe(12000);
  });

  it.each([
    undefined,
    "",
    "abc",
    "0",
    "-5",
    "1.5",
    "999999999",
  ])("不正な値 %s はundefined", (value) => {
    expect(parseGained(value, 612400)).toBeUndefined();
  });
});
