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
    expect(screen.queryByText(/あがった！/)).not.toBeInTheDocument();
    expect(
      screen.getByText("つぎのレベルまで あと ¥1,500"),
    ).toBeInTheDocument();
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

    expect(
      screen.getByText("ハネスライムは レベル25に あがった！"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/しんかした！/)).not.toBeInTheDocument();
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

    expect(
      screen.getByText("ハネスライムは レベル21に あがった！"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("ツノスライムは ハネスライムに しんかした！"),
    ).toBeInTheDocument();
  });

  it("目標に届いたらキングドラゴン誕生を出す", () => {
    render(
      <CelebrationBanner
        gained={20000}
        goal={300000}
        month="2026-11"
        revenue={305000}
      />,
    );

    expect(
      screen.getByText(
        "もくひょうたっせい！ キングドラゴンが たんじょうした！",
      ),
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
    expect(screen.queryByText(/あがった！/)).not.toBeInTheDocument();
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

    await userEvent.click(screen.getByRole("button", { name: "とじる" }));

    expect(replace).toHaveBeenCalledWith("/?month=2026-11", { scroll: false });
  });
});
