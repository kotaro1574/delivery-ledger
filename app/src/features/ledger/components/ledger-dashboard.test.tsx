import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LedgerDashboard } from "./ledger-dashboard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

const summary = {
  revenue: 8200,
  expense: 0,
  paidExpense: 0,
  profit: 8200,
  byCategory: [],
  metrics: {
    wagePerHour: 1822,
    perDelivery: 1025,
    deliveries: 8,
    onlineHours: 4.5,
  },
};

describe("LedgerDashboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("収入取引を編集できる", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: "entry-1" }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LedgerDashboard
        month="2026-06"
        summary={summary}
        entries={[
          {
            id: "entry-1",
            date: "2026-06-10",
            kind: "income",
            category: "売上高",
            categoryCode: "501",
            description: "夜ピーク",
            amount: 8200,
            deliveries: 8,
            onlineMinutes: 270,
            receiptKey: null,
            businessAmount: null,
            privateAmount: null,
          },
        ]}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "編集 夜ピーク" }),
    );
    fireEvent.change(screen.getByLabelText("売上"), {
      target: { value: "9400" },
    });
    fireEvent.change(screen.getByLabelText("時間"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("分"), {
      target: { value: "15" },
    });
    await userEvent.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/entries/entry-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          kind: "income",
          date: "2026-06-10",
          amount: 9400,
          deliveries: 8,
          onlineMinutes: 315,
          memo: "夜ピーク",
        }),
      }),
    );
  });

  it("取引を削除できる", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: "entry-1" }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LedgerDashboard
        month="2026-06"
        summary={summary}
        entries={[
          {
            id: "entry-1",
            date: "2026-06-10",
            kind: "income",
            category: "売上高",
            categoryCode: "501",
            description: "夜ピーク",
            amount: 8200,
            deliveries: 8,
            onlineMinutes: 270,
            receiptKey: null,
            businessAmount: null,
            privateAmount: null,
          },
        ]}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "削除 夜ピーク" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "削除する" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/entries/entry-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("経費の事業分と私用分を区別して表示する", () => {
    render(
      <LedgerDashboard
        month="2026-06"
        summary={{
          ...summary,
          revenue: 65559,
          expense: 564,
          paidExpense: 705,
          profit: 64995,
          byCategory: [{ code: "601", name: "車両費", amount: 564 }],
        }}
        entries={[
          {
            id: "entry-2",
            date: "2026-06-09",
            kind: "expense",
            category: "車両費",
            categoryCode: "601",
            description: "SOLATOガソリン",
            amount: 705,
            deliveries: null,
            onlineMinutes: null,
            receiptKey: "receipt-1",
            businessAmount: 564,
            privateAmount: 141,
          },
        ]}
      />,
    );

    expect(screen.getByText("経費（事業分）")).toBeInTheDocument();
    expect(screen.getByText("支払総額 ¥705")).toBeInTheDocument();
    expect(screen.getByText("私用分 ¥141")).toBeInTheDocument();
    expect(screen.getByText("事業分 ¥564 / 私用分 ¥141")).toBeInTheDocument();
    expect(screen.getByText("経費内訳（事業分）")).toBeInTheDocument();
  });

  it("日別収支トレンドを表示する", () => {
    render(
      <LedgerDashboard
        month="2026-06"
        summary={{
          ...summary,
          revenue: 10400,
          expense: 564,
          paidExpense: 705,
          profit: 9836,
        }}
        entries={[
          {
            id: "income-1",
            date: "2026-06-09",
            kind: "income",
            category: "売上高",
            categoryCode: "501",
            description: "昼ピーク",
            amount: 5200,
            deliveries: 6,
            onlineMinutes: 180,
            receiptKey: null,
            businessAmount: null,
            privateAmount: null,
          },
          {
            id: "income-2",
            date: "2026-06-09",
            kind: "income",
            category: "売上高",
            categoryCode: "501",
            description: "夜ピーク",
            amount: 1800,
            deliveries: 2,
            onlineMinutes: 90,
            receiptKey: null,
            businessAmount: null,
            privateAmount: null,
          },
          {
            id: "expense-1",
            date: "2026-06-09",
            kind: "expense",
            category: "車両費",
            categoryCode: "601",
            description: "SOLATOガソリン",
            amount: 705,
            deliveries: null,
            onlineMinutes: null,
            receiptKey: "receipt-1",
            businessAmount: 564,
            privateAmount: 141,
          },
          {
            id: "income-3",
            date: "2026-06-10",
            kind: "income",
            category: "売上高",
            categoryCode: "501",
            description: "朝ピーク",
            amount: 3400,
            deliveries: 4,
            onlineMinutes: 120,
            receiptKey: null,
            businessAmount: null,
            privateAmount: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("DAILY TREND")).toBeInTheDocument();
    expect(screen.getByText("日別収支トレンド")).toBeInTheDocument();
    expect(screen.getByText("最高利益日")).toBeInTheDocument();
    expect(screen.getByText("6/9")).toBeInTheDocument();
    expect(screen.getByText("平均利益")).toBeInTheDocument();
    expect(screen.getByText("¥4,918")).toBeInTheDocument();
    expect(screen.getByText("経費率")).toBeInTheDocument();
    expect(screen.getByText("5%")).toBeInTheDocument();
    expect(
      screen.getByLabelText("2026年6月の日別収支トレンド"),
    ).toBeInTheDocument();
  });
});
