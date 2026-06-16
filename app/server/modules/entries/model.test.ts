import { describe, expect, it } from "vitest";
import { EntriesModel } from "./model";

describe("EntriesModel", () => {
  it("収入更新リクエストを検証する", () => {
    expect(
      EntriesModel.UpdateRequest.parse({
        kind: "income",
        date: "2026-06-10",
        amount: 9400,
        deliveries: 9,
        onlineMinutes: 315,
        memo: "夜ピーク",
      }),
    ).toEqual({
      kind: "income",
      date: "2026-06-10",
      amount: 9400,
      deliveries: 9,
      onlineMinutes: 315,
      memo: "夜ピーク",
    });
  });

  it("一覧Itemに編集用フィールドを含める", () => {
    expect(
      EntriesModel.Item.parse({
        id: "entry-1",
        date: "2026-06-10",
        kind: "income",
        category: "売上高",
        categoryCode: "501",
        description: "夜ピーク",
        amount: 9400,
        deliveries: 9,
        onlineMinutes: 315,
        receiptKey: null,
      }),
    ).toEqual({
      id: "entry-1",
      date: "2026-06-10",
      kind: "income",
      category: "売上高",
      categoryCode: "501",
      description: "夜ピーク",
      amount: 9400,
      deliveries: 9,
      onlineMinutes: 315,
      receiptKey: null,
    });
  });
});
