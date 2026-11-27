import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommandMenu } from "./command-menu";

const items = [
  { href: "/", label: "だいちょう" },
  { href: "/year", label: "ねんかん" },
];

describe("CommandMenu", () => {
  it("今いる画面の項目に aria-current を付ける", () => {
    render(<CommandMenu activeHref="/year" items={items} />);

    expect(screen.getByRole("link", { name: "ねんかん" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "だいちょう" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("下の階層のページでも親の項目を選択中にする", () => {
    render(<CommandMenu activeHref="/year/expenses" items={items} />);

    expect(screen.getByRole("link", { name: "ねんかん" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "だいちょう" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("追加の項目をメニューの中に置ける", () => {
    render(
      <CommandMenu activeHref="/" items={items}>
        <button type="button">ログアウト</button>
      </CommandMenu>,
    );

    expect(
      screen
        .getByRole("navigation")
        .contains(screen.getByRole("button", { name: "ログアウト" })),
    ).toBe(true);
  });
});
