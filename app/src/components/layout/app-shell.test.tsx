import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/input",
}));

vi.mock("@/lib/auth/client", () => ({
  signOut: vi.fn(),
}));

describe("AppShell", () => {
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
});
