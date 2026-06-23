import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { YearlyDashboard } from "./yearly-dashboard";

const summary = {
  year: "2026",
  revenue: 155_559,
  expense: 10_564,
  paidExpense: 12_705,
  profit: 144_995,
  profitRate: 93,
  monthly: Array.from({ length: 12 }, (_, index) => {
    const month = `${index + 1}月`;
    const isoMonth = `2026-${String(index + 1).padStart(2, "0")}`;

    if (index === 5) {
      return {
        month: isoMonth,
        label: month,
        revenue: 65_559,
        expense: 564,
        paidExpense: 705,
        profit: 64_995,
        profitRate: 99,
      };
    }

    if (index === 6) {
      return {
        month: isoMonth,
        label: month,
        revenue: 90_000,
        expense: 10_000,
        paidExpense: 12_000,
        profit: 80_000,
        profitRate: 89,
      };
    }

    return {
      month: isoMonth,
      label: month,
      revenue: 0,
      expense: 0,
      paidExpense: 0,
      profit: 0,
      profitRate: 0,
    };
  }),
  byCategory: [
    { code: "601", name: "車両費", amount: 8_564 },
    { code: "602", name: "通信費", amount: 2_000 },
  ],
};

describe("YearlyDashboard", () => {
  it("年次の主要数値とグラフを表示する", () => {
    render(<YearlyDashboard summary={summary} year="2026" />);

    expect(screen.getByText("YEARLY LEDGER")).toBeInTheDocument();
    expect(screen.getByText("2026年")).toBeInTheDocument();
    expect(screen.getByText("年間売上")).toBeInTheDocument();
    expect(screen.getByText("¥155,559")).toBeInTheDocument();
    expect(screen.getByText("事業経費")).toBeInTheDocument();
    expect(screen.getByText("¥10,564")).toBeInTheDocument();
    expect(screen.getByText("差引利益")).toBeInTheDocument();
    expect(screen.getByText("¥144,995")).toBeInTheDocument();
    expect(screen.getByText("利益率")).toBeInTheDocument();
    expect(screen.getByText("93%")).toBeInTheDocument();
    expect(
      screen.getByLabelText("2026年の月別収支トレンド"),
    ).toBeInTheDocument();
    expect(screen.getByText("月別利益率")).toBeInTheDocument();
  });

  it("月別ポイントを選ぶと詳細ポップオーバーを表示する", async () => {
    render(<YearlyDashboard summary={summary} year="2026" />);

    await userEvent.click(
      screen.getByRole("button", { name: "6月の年次収支詳細" }),
    );

    const tooltip = screen.getByRole("tooltip");
    expect(within(tooltip).getByText("2026年6月")).toBeInTheDocument();
    expect(within(tooltip).getByText("売上 ¥65,559")).toBeInTheDocument();
    expect(within(tooltip).getByText("事業経費 ¥564")).toBeInTheDocument();
    expect(within(tooltip).getByText("差引利益 ¥64,995")).toBeInTheDocument();
    expect(within(tooltip).getByText("利益率 99%")).toBeInTheDocument();
  });

  it("スマホでも触りやすい横スクロール幅で年間グラフを表示する", () => {
    render(<YearlyDashboard summary={summary} year="2026" />);

    expect(screen.getByTestId("yearly-trend-scroll")).toHaveClass(
      "overflow-x-auto",
    );
    expect(screen.getByTestId("yearly-trend-chart-area")).toHaveClass(
      "min-w-[44rem]",
    );
  });
});
