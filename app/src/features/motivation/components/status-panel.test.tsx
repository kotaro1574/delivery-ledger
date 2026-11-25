import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StatusPanel } from "./status-panel";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const today = new Date(2026, 10, 25);

describe("StatusPanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    refresh.mockReset();
  });

  it("累計売上からレベルと称号とキャラを表示する", () => {
    render(
      <StatusPanel
        goal={null}
        lifetimeRevenue={612400}
        month="2026-11"
        revenue={0}
        today={today}
      />,
    );

    expect(screen.getByText("Lv.12")).toBeInTheDocument();
    expect(screen.getByText("レギュラー")).toBeInTheDocument();
    expect(screen.getByText("次のLvまで ¥77,600")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "自転車で配達するレギュラー" }),
    ).toBeInTheDocument();
  });

  it("目標がない月は目標設定ボタンを出す", () => {
    render(
      <StatusPanel
        goal={null}
        lifetimeRevenue={0}
        month="2026-11"
        revenue={0}
        today={today}
      />,
    );

    expect(
      screen.getByRole("button", { name: "今月の目標を決めよう" }),
    ).toBeInTheDocument();
  });

  it("今月は達成率と1日ペースを出す", () => {
    render(
      <StatusPanel
        goal={300000}
        lifetimeRevenue={612400}
        month="2026-11"
        revenue={186000}
        today={today}
      />,
    );

    expect(screen.getByText("62%")).toBeInTheDocument();
    expect(screen.getByText("あと ¥114,000")).toBeInTheDocument();
    expect(screen.getByText("1日 ¥19,000 ペース")).toBeInTheDocument();
  });

  it("過去月で達成していたら目標達成とオーバー額を出しペースは出さない", () => {
    render(
      <StatusPanel
        goal={300000}
        lifetimeRevenue={612400}
        month="2026-10"
        revenue={320000}
        today={today}
      />,
    );

    expect(screen.getByText("目標達成！")).toBeInTheDocument();
    expect(screen.getByText("+¥20,000 オーバー")).toBeInTheDocument();
    expect(screen.queryByText(/ペース/)).not.toBeInTheDocument();
  });

  it("過去月で未達なら未達と表示する", () => {
    render(
      <StatusPanel
        goal={300000}
        lifetimeRevenue={612400}
        month="2026-10"
        revenue={100000}
        today={today}
      />,
    );

    expect(screen.getByText("未達 あと ¥200,000 だった")).toBeInTheDocument();
  });

  it("目標金額を保存できる", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ month: "2026-11", targetAmount: 250000 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <StatusPanel
        goal={null}
        lifetimeRevenue={0}
        month="2026-11"
        revenue={0}
        today={today}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "今月の目標を決めよう" }),
    );
    await userEvent.type(screen.getByLabelText("目標金額"), "250000");
    await userEvent.click(screen.getByRole("button", { name: "目標を保存" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/goals/2026-11",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ targetAmount: 250000 }),
      }),
    );
  });

  it("空で保存すると目標を消す", async () => {
    const fetchMock = vi.fn(async () => Response.json({ month: "2026-11" }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <StatusPanel
        goal={300000}
        lifetimeRevenue={0}
        month="2026-11"
        revenue={0}
        today={today}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "目標を編集" }));
    await userEvent.clear(screen.getByLabelText("目標金額"));
    await userEvent.click(screen.getByRole("button", { name: "目標を保存" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/goals/2026-11",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
