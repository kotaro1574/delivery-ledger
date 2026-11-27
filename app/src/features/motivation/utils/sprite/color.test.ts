import { describe, expect, it } from "vitest";
import { bodyPalette, mixHue } from "./color";

const channels = (color: string) =>
  [1, 3, 5].map((k) => Number.parseInt(color.slice(k, k + 2), 16));

describe("mixHue", () => {
  it("色相の近い側を回って補間する", () => {
    const [r, g, b] = channels(mixHue("#a87ce8", "#ffa24a", 0.5));
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });

  it("両端は元の色になる", () => {
    expect(mixHue("#7fd36a", "#62b8f0", 0)).toBe("#7fd36a");
    expect(mixHue("#7fd36a", "#62b8f0", 1)).toBe("#62b8f0");
  });
});

describe("bodyPalette", () => {
  it("レベルごとに体の色が変わる", () => {
    for (let level = 2; level <= 41; level++) {
      expect(bodyPalette(level).base).not.toBe(bodyPalette(level - 1).base);
    }
  });

  it("キングは金色で固定", () => {
    expect(bodyPalette(41)).toEqual(bodyPalette(80));
  });

  it("半透明の色を返さない", () => {
    for (let level = 1; level <= 53; level++) {
      expect(
        Object.values(bodyPalette(level)).every((color) =>
          /^#[0-9a-f]{6}$/.test(color),
        ),
      ).toBe(true);
    }
  });
});
