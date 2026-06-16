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
});
