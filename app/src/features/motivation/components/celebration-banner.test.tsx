import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CelebrationBanner } from "./celebration-banner";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("CelebrationBanner", () => {
  afterEach(() => {
    replace.mockReset();
  });

  it("稼いだ金額を表示しレベルが変わらなければLEVEL UPは出さない", () => {
    render(
      <CelebrationBanner
        gained={5000}
        lifetimeRevenue={612400}
        month="2026-11"
      />,
    );

    expect(screen.getByText("+¥5,000 ゲット！")).toBeInTheDocument();
    expect(screen.queryByText("LEVEL UP!")).not.toBeInTheDocument();
  });

  it("レベルが上がったらLEVEL UPと称号の進化を出す", () => {
    render(
      <CelebrationBanner
        gained={20000}
        lifetimeRevenue={455000}
        month="2026-11"
      />,
    );

    expect(screen.getByText("LEVEL UP!")).toBeInTheDocument();
    expect(screen.getByText("Lv.9 → Lv.10")).toBeInTheDocument();
    expect(screen.getByText("レギュラーに進化！")).toBeInTheDocument();
  });

  it("称号が変わらないレベルアップでは進化を出さない", () => {
    render(
      <CelebrationBanner
        gained={40000}
        lifetimeRevenue={640000}
        month="2026-11"
      />,
    );

    expect(screen.getByText("Lv.11 → Lv.12")).toBeInTheDocument();
    expect(screen.queryByText(/進化！/)).not.toBeInTheDocument();
  });

  it("閉じると表示中の月のURLに戻す", async () => {
    render(
      <CelebrationBanner
        gained={12000}
        lifetimeRevenue={612400}
        month="2026-11"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "閉じる" }));

    expect(replace).toHaveBeenCalledWith("/?month=2026-11", { scroll: false });
  });
});
