import { describe, expect, it } from "vitest";
import { buildJournal } from "./journal";

describe("buildJournal", () => {
  it("収入から売掛金と売上高の仕訳を作る", () => {
    const entry = buildJournal({
      kind: "income",
      userId: "user-1",
      date: "2026-05-31",
      amount: 8200,
    });

    expect(entry.lines).toEqual([
      { accountCode: "135", side: "debit", amount: 8200 },
      { accountCode: "501", side: "credit", amount: 8200 },
    ]);
    expect(entry.debitTotal).toBe(8200);
    expect(entry.creditTotal).toBe(8200);
  });

  it("100%事業経費から経費と現金の仕訳を作る", () => {
    const entry = buildJournal({
      kind: "expense",
      userId: "user-1",
      date: "2026-05-31",
      amount: 2400,
      categoryCode: "604",
      businessRatio: 100,
      receiptKey: "r/user-1/a.jpg",
    });

    expect(entry.lines).toEqual([
      {
        accountCode: "604",
        side: "debit",
        amount: 2400,
        receiptKey: "r/user-1/a.jpg",
      },
      { accountCode: "101", side: "credit", amount: 2400 },
    ]);
  });

  it("通信費70%の私用分を事業主貸へ振る", () => {
    const entry = buildJournal({
      kind: "expense",
      userId: "user-1",
      date: "2026-05-31",
      amount: 3500,
      categoryCode: "603",
      businessRatio: 70,
    });

    expect(entry.lines).toEqual([
      { accountCode: "603", side: "debit", amount: 2450 },
      { accountCode: "334", side: "debit", amount: 1050 },
      { accountCode: "101", side: "credit", amount: 3500 },
    ]);
  });

  it("車両費80%を四捨五入し、差額を私用分にする", () => {
    const entry = buildJournal({
      kind: "expense",
      userId: "user-1",
      date: "2026-05-31",
      amount: 999,
      categoryCode: "601",
      businessRatio: 80,
    });

    expect(entry.lines).toEqual([
      { accountCode: "601", side: "debit", amount: 799 },
      { accountCode: "334", side: "debit", amount: 200 },
      { accountCode: "101", side: "credit", amount: 999 },
    ]);
    expect(entry.debitTotal).toBe(entry.creditTotal);
  });

  it("0円以下の金額を拒否する", () => {
    expect(() =>
      buildJournal({
        kind: "income",
        userId: "user-1",
        date: "2026-05-31",
        amount: 0,
      }),
    ).toThrow("金額は1円以上で入力してください");
  });
});
