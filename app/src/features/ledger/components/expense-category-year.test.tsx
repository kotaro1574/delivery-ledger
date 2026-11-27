import type { EntriesModel } from "@server/modules/entries/model";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExpenseCategoryYear } from "./expense-category-year";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const base = {
  kind: "expense",
  category: "車両費",
  categoryCode: "601",
  deliveries: null,
  onlineMinutes: null,
  receiptKey: null,
} satisfies Partial<EntriesModel.Item>;

const entries: EntriesModel.Item[] = [
  {
    ...base,
    id: "a",
    date: "2026-11-24",
    description: "ガソリン",
    receiptKey: "receipts/a.jpg",
    amount: 3200,
    businessAmount: 3200,
    privateAmount: 0,
  },
  {
    ...base,
    id: "b",
    date: "2026-03-10",
    description: "オイル交換",
    amount: 6000,
    businessAmount: 4800,
    privateAmount: 1200,
  },
];

describe("ExpenseCategoryYear", () => {
  it("選んだ年と科目の合計と明細の件数を出す", () => {
    render(
      <ExpenseCategoryYear categoryCode="601" entries={entries} year="2026" />,
    );

    expect(screen.getByText("2026年の けいひ")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "車両費" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("¥8,000")).toBeInTheDocument();
    expect(screen.getByText("しはらい ¥9,200")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "めいさい（2けん）" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ガソリン")).toBeInTheDocument();
  });

  it("レシートがある明細に印を出す", () => {
    render(
      <ExpenseCategoryYear categoryCode="601" entries={entries} year="2026" />,
    );

    expect(screen.getAllByText("車両費 · レシートあり")).toHaveLength(1);
  });

  it("科目のボタンは同じ年の別の科目へリンクする", () => {
    render(
      <ExpenseCategoryYear categoryCode="601" entries={entries} year="2026" />,
    );

    expect(screen.getByRole("link", { name: "通信費" })).toHaveAttribute(
      "href",
      "/year/expenses?year=2026&category=603",
    );
  });

  it("年の切り替えは同じ科目の前後の年へリンクする", () => {
    render(
      <ExpenseCategoryYear categoryCode="601" entries={entries} year="2026" />,
    );

    expect(screen.getByRole("link", { name: "まえの とし" })).toHaveAttribute(
      "href",
      "/year/expenses?year=2025&category=601",
    );
    expect(screen.getByRole("link", { name: "つぎの とし" })).toHaveAttribute(
      "href",
      "/year/expenses?year=2027&category=601",
    );
  });

  it("明細がない科目は空表示", () => {
    render(<ExpenseCategoryYear categoryCode="601" entries={[]} year="2026" />);

    expect(
      screen.getByText("この としの 車両費は まだ ない"),
    ).toBeInTheDocument();
  });
});
