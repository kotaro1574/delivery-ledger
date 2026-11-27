import { describe, expect, it } from "vitest";
import { createGrid, drawPart, INK, SIZE } from "./canvas";

describe("drawPart", () => {
  it("48x48のグリッドを作る", () => {
    const grid = createGrid();
    expect(grid).toHaveLength(SIZE);
    expect(grid.every((row) => row.length === SIZE)).toBe(true);
    expect(SIZE).toBe(48);
  });

  it("描いた部品の外側をインク色で囲む", () => {
    const grid = createGrid();
    drawPart(grid, (put) => put(10, 10, "#ffffff"));
    expect(grid[10][10]).toBe("#ffffff");
    expect(grid[9][10]).toBe(INK);
    expect(grid[10][11]).toBe(INK);
    expect(grid[9][9]).toBeNull();
  });

  it("outline: falseなら輪郭を付けない", () => {
    const grid = createGrid();
    drawPart(grid, (put) => put(10, 10, "#ffffff"), { outline: false });
    expect(grid[10][10]).toBe("#ffffff");
    expect(grid[9][10]).toBeNull();
  });

  it("キャンバスの外の点は捨てる", () => {
    const grid = createGrid();
    drawPart(grid, (put) => {
      put(-1, 10, "#ffffff");
      put(10, 50, "#ffffff");
    });
    expect(grid.flat().every((cell) => cell === null || cell === INK)).toBe(
      true,
    );
  });
});
