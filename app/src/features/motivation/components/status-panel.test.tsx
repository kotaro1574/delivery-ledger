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

  it("今月の達成率からレベルと称号とスライムを表示する", () => {
    render(
      <StatusPanel
        goal={300000}
        kingMonths={0}
        month="2026-11"
        revenue={186000}
        today={today}
      />,
    );

    expect(screen.getByText("Lv.25")).toBeInTheDocument();
    expect(screen.getByText("エース")).toBeInTheDocument();
    expect(screen.getByText("つぎのレベルまで ¥1,500")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Lv.25 エースの はいたつスライム" }),
    ).toBeInTheDocument();
  });

  it("目標がない月はたまごを表示する", () => {
    render(
      <StatusPanel
        goal={null}
        kingMonths={0}
        month="2026-11"
        revenue={0}
        today={today}
      />,
    );

    expect(
      screen.getByRole("img", { name: "スライムのたまご" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("もくひょうを きめると スライムが うまれる"),
    ).toBeInTheDocument();
  });

  it("キングになった回数を表示する", () => {
    render(
      <StatusPanel
        goal={300000}
        kingMonths={3}
        month="2026-11"
        revenue={0}
        today={today}
      />,
    );

    expect(screen.getByText("キング 3回")).toBeInTheDocument();
  });

  it("目標を達成した月はキングになる", () => {
    render(
      <StatusPanel
        goal={300000}
        kingMonths={1}
        month="2026-11"
        revenue={300000}
        today={today}
      />,
    );

    expect(screen.getByText("キング")).toBeInTheDocument();
    expect(screen.getByText("もくひょう たっせい！")).toBeInTheDocument();
  });

  it("目標がない月は目標設定ボタンを出す", () => {
    render(
      <StatusPanel
        goal={null}
        kingMonths={0}
        month="2026-11"
        revenue={0}
        today={today}
      />,
    );

    expect(
      screen.getByRole("button", { name: "こんげつの もくひょうを きめよう" }),
    ).toBeInTheDocument();
  });

  it("今月は達成率と1日ペースを出す", () => {
    render(
      <StatusPanel
        goal={300000}
        kingMonths={0}
        month="2026-11"
        revenue={186000}
        today={today}
      />,
    );

    expect(screen.getByText("62%")).toBeInTheDocument();
    expect(screen.getByText("かせいだ ¥186,000")).toBeInTheDocument();
    expect(screen.getByText("あと ¥114,000")).toBeInTheDocument();
    expect(screen.getByText("1にち ¥19,000 ペース")).toBeInTheDocument();
  });

  it("過去月で達成していたら目標達成とオーバー額を出しペースは出さない", () => {
    render(
      <StatusPanel
        goal={300000}
        kingMonths={0}
        month="2026-10"
        revenue={320000}
        today={today}
      />,
    );

    expect(screen.getByText("もくひょう たっせい！")).toBeInTheDocument();
    expect(screen.getByText("+¥20,000 オーバー")).toBeInTheDocument();
    expect(screen.queryByText(/ペース/)).not.toBeInTheDocument();
  });

  it("過去月で未達なら未達と表示する", () => {
    render(
      <StatusPanel
        goal={300000}
        kingMonths={0}
        month="2026-10"
        revenue={100000}
        today={today}
      />,
    );

    expect(screen.getByText("あと ¥200,000 たりなかった")).toBeInTheDocument();
  });

  it("目標金額を保存できる", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ month: "2026-11", targetAmount: 250000 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <StatusPanel
        goal={null}
        kingMonths={0}
        month="2026-11"
        revenue={0}
        today={today}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "こんげつの もくひょうを きめよう" }),
    );
    await userEvent.type(screen.getByLabelText("もくひょうきんがく"), "250000");
    await userEvent.click(
      screen.getByRole("button", { name: "もくひょうを セーブ" }),
    );

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
        kingMonths={0}
        month="2026-11"
        revenue={0}
        today={today}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "もくひょうを かえる" }),
    );
    await userEvent.clear(screen.getByLabelText("もくひょうきんがく"));
    await userEvent.click(
      screen.getByRole("button", { name: "もくひょうを セーブ" }),
    );

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/goals/2026-11",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
