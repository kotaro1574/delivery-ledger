import { describe, expect, it } from "vitest";
import { classifyExpenseCategory } from "./ocr";

describe("classifyExpenseCategory", () => {
  it("ガソリンや充電を車両費に分類する", () => {
    expect(
      classifyExpenseCategory({
        storeName: "ENEOS",
        items: ["レギュラーガソリン 18L"],
      }),
    ).toBe("601");

    expect(
      classifyExpenseCategory({
        storeName: "EV QUICK",
        items: ["急速充電"],
      }),
    ).toBe("601");
  });

  it("スマホやSIMを通信費に分類する", () => {
    expect(
      classifyExpenseCategory({
        storeName: "楽天モバイル",
        items: ["スマホ通信料"],
      }),
    ).toBe("603");

    expect(
      classifyExpenseCategory({
        storeName: "IIJmio",
        items: ["SIM 月額料金"],
      }),
    ).toBe("603");
  });

  it("判定できない内容は雑費に分類する", () => {
    expect(
      classifyExpenseCategory({
        storeName: "不明",
        items: ["その他"],
      }),
    ).toBe("699");
  });
});
