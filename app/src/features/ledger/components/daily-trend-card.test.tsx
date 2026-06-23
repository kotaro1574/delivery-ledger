import type { EntriesModel } from "@server/modules/entries/model";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DailyTrendCard } from "./daily-trend-card";

const baseEntry = {
  category: "売上高",
  categoryCode: "501",
  description: "Uber売上",
  deliveries: null,
  onlineMinutes: null,
  receiptKey: null,
  privateAmount: null,
} satisfies Omit<
  EntriesModel.Item,
  "id" | "date" | "kind" | "amount" | "businessAmount"
>;

describe("DailyTrendCard", () => {
  it("日別ポイントを選ぶと詳細ポップオーバーを表示する", async () => {
    const entries: EntriesModel.Item[] = [
      {
        ...baseEntry,
        id: "income-1",
        date: "2026-06-09",
        kind: "income",
        amount: 7000,
        businessAmount: null,
      },
      {
        ...baseEntry,
        id: "expense-1",
        date: "2026-06-09",
        kind: "expense",
        category: "車両費",
        categoryCode: "601",
        description: "ガソリン",
        amount: 705,
        businessAmount: 564,
        privateAmount: 141,
      },
    ];

    render(<DailyTrendCard entries={entries} month="2026-06" />);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "6/9の収支詳細" }),
    );

    const tooltip = screen.getByRole("tooltip");
    expect(within(tooltip).getByText("6/9")).toBeInTheDocument();
    expect(within(tooltip).getByText("売上 ¥7,000")).toBeInTheDocument();
    expect(within(tooltip).getByText("事業経費 ¥564")).toBeInTheDocument();
    expect(within(tooltip).getByText("利益 ¥6,436")).toBeInTheDocument();
  });

  it("スマホでも触りやすい横スクロール幅でグラフを表示する", () => {
    render(
      <DailyTrendCard
        entries={[
          {
            ...baseEntry,
            id: "income-1",
            date: "2026-06-09",
            kind: "income",
            amount: 7000,
            businessAmount: null,
          },
        ]}
        month="2026-06"
      />,
    );

    expect(screen.getByTestId("daily-trend-scroll")).toHaveClass(
      "overflow-x-auto",
    );
    expect(screen.getByTestId("daily-trend-chart-area")).toHaveClass(
      "min-w-[42rem]",
    );
  });
});
