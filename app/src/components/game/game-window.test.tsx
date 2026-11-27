import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GameWindow } from "./game-window";

describe("GameWindow", () => {
  it("タイトル付きのウィンドウはタイトルで名前が付く", () => {
    render(<GameWindow title="ステータス">なかみ</GameWindow>);

    expect(
      screen.getByRole("region", { name: "ステータス" }),
    ).toHaveTextContent("なかみ");
  });
});
