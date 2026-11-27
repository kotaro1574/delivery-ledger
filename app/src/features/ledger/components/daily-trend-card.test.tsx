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
  {
    ...baseEntry,
    id: "income-2",
    date: "2026-06-12",
    kind: "income",
    amount: 3400,
    businessAmount: null,
  },
];

const stats = [{ date: "2026-06-12", deliveries: 5, onlineMinutes: 150 }];

describe("DailyTrendCard", () => {
  it("選んだ日のはたらいた時間・時給・配達件数を表示する", () => {
    render(<DailyTrendCard entries={entries} month="2026-06" stats={stats} />);

    const detail = screen.getByTestId("daily-trend-detail");
    expect(within(detail).getByText("2時間30分")).toBeInTheDocument();
    expect(within(detail).getByText("¥1,360")).toBeInTheDocument();
    expect(within(detail).getByText("5件")).toBeInTheDocument();
  });

  it("はたらいた記録がない日は時間・時給・件数を出さない", async () => {
    render(<DailyTrendCard entries={entries} month="2026-06" stats={stats} />);

    await userEvent.click(
      screen.getByRole("button", { name: "6/9(火)の収支詳細" }),
    );

    const detail = screen.getByTestId("daily-trend-detail");
    expect(within(detail).queryByText("じきゅう")).not.toBeInTheDocument();
  });

  it("最後の稼働日の内訳を最初から表示する", () => {
    render(<DailyTrendCard entries={entries} month="2026-06" stats={stats} />);

    const detail = screen.getByTestId("daily-trend-detail");
    expect(within(detail).getByText("6/12")).toBeInTheDocument();
    expect(within(detail).getByText("(金)")).toBeInTheDocument();
    expect(within(detail).getAllByText("¥3,400")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "6/12(金)の収支詳細" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("日付をタップするとその日の売上・事業経費・利益を表示する", async () => {
    render(<DailyTrendCard entries={entries} month="2026-06" stats={stats} />);

    await userEvent.click(
      screen.getByRole("button", { name: "6/9(火)の収支詳細" }),
    );

    const detail = screen.getByTestId("daily-trend-detail");
    expect(within(detail).getByText("6/9")).toBeInTheDocument();
    expect(within(detail).getByText("(火)")).toBeInTheDocument();
    expect(within(detail).getByText("¥7,000")).toBeInTheDocument();
    expect(within(detail).getByText("¥564")).toBeInTheDocument();
    expect(within(detail).getByText("¥6,436")).toBeInTheDocument();
  });

  it("稼働していない日をタップすると記録なしと表示する", async () => {
    render(<DailyTrendCard entries={entries} month="2026-06" stats={stats} />);

    await userEvent.click(
      screen.getByRole("button", { name: "6/10(水)の収支詳細" }),
    );

    expect(
      within(screen.getByTestId("daily-trend-detail")).getByText(
        "この ひの きろくは ない",
      ),
    ).toBeInTheDocument();
  });

  it("全日分の日付と曜日を2段で並べ、横スクロールできる", () => {
    render(<DailyTrendCard entries={entries} month="2026-06" stats={stats} />);

    const chart = screen.getByTestId("daily-trend-chart-area");
    const days = within(chart).getAllByRole("button");

    expect(days).toHaveLength(30);
    expect(days[0]).toHaveTextContent("1月");
    expect(days[5]).toHaveTextContent("6土");
    expect(days[6]).toHaveTextContent("7日");
    expect(chart).toHaveStyle({ minWidth: "60rem" });
    expect(screen.getByTestId("daily-trend-scroll")).toHaveClass(
      "overflow-x-auto",
    );
  });

  it("金額の目盛りを表示する", () => {
    render(<DailyTrendCard entries={entries} month="2026-06" stats={stats} />);

    expect(screen.getByText("8,000")).toBeInTheDocument();
    expect(screen.getByText("4,000")).toBeInTheDocument();
  });

  it("記録が無い月は空表示にする", () => {
    render(<DailyTrendCard entries={[]} month="2026-06" stats={[]} />);

    expect(
      screen.getByText("この つきの きろくは まだ ない"),
    ).toBeInTheDocument();
  });

  it("記録のない日の日付も紺の背景で読める濃さで表示する", () => {
    render(<DailyTrendCard entries={entries} month="2026-06" stats={stats} />);

    const day = within(
      screen.getByRole("button", { name: "6/10(水)の収支詳細" }),
    ).getByText("10");
    expect(day.className).not.toMatch(/game-sub\)\]\/\d+/);
  });
});
