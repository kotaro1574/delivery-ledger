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

  it("レベルが変わらなければ金額と次Lvまでを出す", () => {
    render(
      <CelebrationBanner
        gained={1000}
        goal={300000}
        month="2026-11"
        revenue={186000}
      />,
    );

    expect(screen.getByText("+¥1,000 ゲット！")).toBeInTheDocument();
    expect(screen.queryByText("LEVEL UP!")).not.toBeInTheDocument();
    expect(screen.getByText("次のLvまで あと ¥1,500")).toBeInTheDocument();
  });

  it("レベルが上がったらLEVEL UPを出す", () => {
    render(
      <CelebrationBanner
        gained={12000}
        goal={300000}
        month="2026-11"
        revenue={186000}
      />,
    );

    expect(screen.getByText("LEVEL UP!")).toBeInTheDocument();
    expect(screen.getByText("Lv.24 → Lv.25")).toBeInTheDocument();
    expect(screen.queryByText(/進化！/)).not.toBeInTheDocument();
  });

  it("段階が変わったら進化を出す", () => {
    render(
      <CelebrationBanner
        gained={10000}
        goal={300000}
        month="2026-11"
        revenue={150000}
      />,
    );

    expect(screen.getByText("Lv.19 → Lv.21")).toBeInTheDocument();
    expect(screen.getByText("エースに進化！")).toBeInTheDocument();
  });

  it("目標に届いたらスライムキング誕生を出す", () => {
    render(
      <CelebrationBanner
        gained={20000}
        goal={300000}
        month="2026-11"
        revenue={305000}
      />,
    );

    expect(
      screen.getByText("目標達成！スライムキング誕生！"),
    ).toBeInTheDocument();
  });

  it("目標がなければ金額だけ出す", () => {
    render(
      <CelebrationBanner
        gained={12000}
        goal={null}
        month="2026-11"
        revenue={12000}
      />,
    );

    expect(screen.getByText("+¥12,000 ゲット！")).toBeInTheDocument();
    expect(screen.queryByText("LEVEL UP!")).not.toBeInTheDocument();
  });

  it("閉じると表示中の月のURLに戻す", async () => {
    render(
      <CelebrationBanner
        gained={1000}
        goal={300000}
        month="2026-11"
        revenue={186000}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "閉じる" }));

    expect(replace).toHaveBeenCalledWith("/?month=2026-11", { scroll: false });
  });
});
