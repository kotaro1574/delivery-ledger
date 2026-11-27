import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "./calendar";

describe("Calendar", () => {
  it("日付の数字は等幅フォントで表示する", () => {
    render(<Calendar defaultMonth={new Date(2026, 5, 1)} mode="single" />);

    expect(screen.getByText("15").closest("button")).toHaveClass("font-mono");
  });
});
