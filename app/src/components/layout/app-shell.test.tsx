import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { signOut } from "@/lib/auth/client";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/input",
}));

vi.mock("@/lib/auth/client", () => ({
  signOut: vi.fn(),
}));

describe("AppShell", () => {
  afterEach(() => {
    vi.mocked(signOut).mockReset();
  });

  it("ゲームのコマンドメニューで画面を切り替える", () => {
    render(<AppShell userName="たろう">なかみ</AppShell>);

    expect(screen.getByRole("link", { name: "きろくする" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "だいちょう" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ねんかん" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ログアウト" }),
    ).toBeInTheDocument();
  });

  it("ログアウトを押すと確認を出し、いいえなら何もしない", async () => {
    render(<AppShell userName="たろう">なかみ</AppShell>);

    await userEvent.click(screen.getByRole("button", { name: "ログアウト" }));

    expect(
      screen.getByRole("alertdialog", { name: "ほんとうに ログアウトする？" }),
    ).toBeInTheDocument();
    expect(signOut).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "いいえ" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("確認ではいを押すとログアウトする", async () => {
    render(<AppShell userName="たろう">なかみ</AppShell>);

    await userEvent.click(screen.getByRole("button", { name: "ログアウト" }));
    await userEvent.click(screen.getByRole("button", { name: "はい" }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
