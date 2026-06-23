import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntryInputForm } from "./entry-input-form";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("EntryInputForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    pushMock.mockReset();
  });

  it("選択した稼働日を収入保存のdateとして送信する", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Response.json({ id: "entry-1" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<EntryInputForm />);

    fireEvent.change(screen.getByLabelText("稼働日"), {
      target: { value: "2026-06-04" },
    });
    fireEvent.change(screen.getByLabelText(/売上/), {
      target: { value: "8200" },
    });
    await userEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const entryCall = fetchMock.mock.calls.find(
      ([url]) => url === "/api/entries",
    );

    expect(entryCall).toBeDefined();
    expect(JSON.parse(String(entryCall?.[1]?.body))).toMatchObject({
      kind: "income",
      date: "2026-06-04",
      amount: 8200,
    });
    expect(screen.getByLabelText("稼働日")).toHaveValue("2026-06-04");
  });

  it("時間と分からオンライン分数を送信する", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Response.json({ id: "entry-1" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<EntryInputForm />);

    fireEvent.change(screen.getByLabelText(/売上/), {
      target: { value: "8200" },
    });
    fireEvent.change(screen.getByLabelText("時間"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText("分"), {
      target: { value: "30" },
    });
    await userEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const entryCall = fetchMock.mock.calls.find(
      ([url]) => url === "/api/entries",
    );

    expect(entryCall).toBeDefined();
    expect(JSON.parse(String(entryCall?.[1]?.body))).toMatchObject({
      kind: "income",
      amount: 8200,
      onlineMinutes: 270,
    });
    expect(screen.getByLabelText("時間")).toHaveValue("");
    expect(screen.getByLabelText("分")).toHaveValue("");
  });

  it("件数とオンライン時間の入力枠を同じ高さで表示する", () => {
    render(<EntryInputForm />);

    expect(screen.getByLabelText("件数").parentElement).toHaveClass("h-12");
    expect(screen.getByLabelText("時間").parentElement).toHaveClass("h-12");
    expect(screen.getByLabelText("分").parentElement).toHaveClass("h-12");
    expect(screen.getByText("時間")).toHaveClass("whitespace-nowrap");
    expect(screen.getByText("分")).toHaveClass("whitespace-nowrap");
  });

  it("収入保存後にトップへ遷移する", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Response.json({ id: "entry-1" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<EntryInputForm />);

    fireEvent.change(screen.getByLabelText(/売上/), {
      target: { value: "8200" },
    });
    await userEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/"));
  });

  it("経費保存後にトップへ遷移する", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Response.json({ id: "entry-1" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<EntryInputForm />);

    await userEvent.click(screen.getByRole("button", { name: "経費" }));
    fireEvent.change(screen.getByLabelText("金額"), {
      target: { value: "2400" },
    });
    await userEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/"));
  });

  it("稼働日下のプリセットボタンを表示しない", () => {
    render(<EntryInputForm />);

    expect(
      screen.queryByRole("button", { name: "Uber売上" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "ガソリン/充電" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "スマホ代" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "保険" }),
    ).not.toBeInTheDocument();
  });

  it("収入入力ではレシート画像入力を表示しない", () => {
    render(<EntryInputForm />);

    expect(screen.queryByLabelText("レシート画像")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /レシート/ }),
    ).not.toBeInTheDocument();
  });

  it("経費を手動入力で保存できる", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Response.json({ id: "entry-1" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<EntryInputForm />);

    await userEvent.click(screen.getByRole("button", { name: "経費" }));
    await userEvent.click(screen.getByRole("button", { name: "通信費" }));
    fireEvent.change(screen.getByLabelText("金額"), {
      target: { value: "3500" },
    });
    fireEvent.change(screen.getByPlaceholderText("メモ（任意）"), {
      target: { value: "スマホ代" },
    });
    await userEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const entryCall = fetchMock.mock.calls.find(
      ([url]) => url === "/api/entries",
    );

    expect(entryCall).toBeDefined();
    expect(JSON.parse(String(entryCall?.[1]?.body))).toMatchObject({
      kind: "expense",
      amount: 3500,
      categoryCode: "603",
      memo: "スマホ代",
    });
  });

  it("経費レシートOCR結果をフォームに反映する", async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, _init?: RequestInit) => {
        if (String(input) === "/api/receipts/analyze") {
          return Response.json({
            amount: 2350,
            date: "2026-06-10",
            storeName: "ENEOS",
            categoryCode: "601",
            memo: "ENEOS レギュラーガソリン",
            confidence: 0.91,
          });
        }

        if (String(input) === "/api/receipts/upload-url") {
          return Response.json({
            url: "/api/receipts/local-upload?key=receipt-1",
            key: "receipt-1",
          });
        }

        if (String(input).startsWith("/api/receipts/local-upload")) {
          return Response.json({ ok: true });
        }

        return Response.json({ id: "entry-1" });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<EntryInputForm />);

    await userEvent.click(screen.getByRole("button", { name: "経費" }));
    await userEvent.upload(
      screen.getByLabelText("レシート画像"),
      new File(["receipt"], "receipt.jpg", { type: "image/jpeg" }),
    );

    await waitFor(() =>
      expect(screen.getByLabelText("金額")).toHaveValue("2,350"),
    );
    expect(screen.getByLabelText("稼働日")).toHaveValue("2026-06-10");
    expect(screen.getByPlaceholderText("メモ（任意）")).toHaveValue(
      "ENEOS レギュラーガソリン",
    );

    await userEvent.click(screen.getByRole("button", { name: "保存する" }));

    const entryCall = fetchMock.mock.calls.find(
      ([url]) => url === "/api/entries",
    );
    expect(entryCall).toBeDefined();
    expect(JSON.parse(String(entryCall?.[1]?.body))).toMatchObject({
      kind: "expense",
      amount: 2350,
      date: "2026-06-10",
      categoryCode: "601",
      memo: "ENEOS レギュラーガソリン",
    });
  });
});
