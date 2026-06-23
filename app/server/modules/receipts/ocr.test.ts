import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeReceiptWithGemini, classifyExpenseCategory } from "./ocr";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("classifyExpenseCategory", () => {
  it("ガソリンや充電を車両費に分類する", () => {
    expect(
      classifyExpenseCategory({
        storeName: "ENEOS",
        items: ["レギュラーガソリン 18L"],
      }),
    ).toBe("601");

    expect(
      classifyExpenseCategory({
        storeName: "EV QUICK",
        items: ["急速充電"],
      }),
    ).toBe("601");
  });

  it("スマホやSIMを通信費に分類する", () => {
    expect(
      classifyExpenseCategory({
        storeName: "楽天モバイル",
        items: ["スマホ通信料"],
      }),
    ).toBe("603");

    expect(
      classifyExpenseCategory({
        storeName: "IIJmio",
        items: ["SIM 月額料金"],
      }),
    ).toBe("603");
  });

  it("判定できない内容は雑費に分類する", () => {
    expect(
      classifyExpenseCategory({
        storeName: "不明",
        items: ["その他"],
      }),
    ).toBe("699");
  });
});

describe("analyzeReceiptWithGemini", () => {
  it("Gemini REST の JSON schema 指定を responseMimeType と responseSchema で送る", async () => {
    const requestBodies: Array<{
      generationConfig?: Record<string, unknown>;
    }> = [];

    const fetchMock = vi.fn(
      async (_input: string | URL | Request, init?: RequestInit) => {
        requestBodies.push(
          JSON.parse(String(init?.body)) as {
            generationConfig?: Record<string, unknown>;
          },
        );

        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        store_name: "ENEOS",
                        items: [{ item_name: "レギュラー", amount: 1200 }],
                        total_amount: 1200,
                        date: "2026-06-19",
                        confidence: 0.9,
                      }),
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    );

    vi.stubGlobal("fetch", fetchMock);

    const file = {
      type: "image/jpeg",
      arrayBuffer: async () => {
        const bytes = new TextEncoder().encode("receipt");
        return bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        );
      },
    } as unknown as File;

    const result = await analyzeReceiptWithGemini({
      file,
      apiKey: "test-key",
      model: "gemini-3.1-flash-lite",
    });

    expect(result.amount).toBe(1200);
    const requestBody = requestBodies[0];

    expect(requestBody?.generationConfig).toMatchObject({
      responseMimeType: "application/json",
    });
    expect(requestBody?.generationConfig).toHaveProperty("responseSchema");
    expect(requestBody?.generationConfig).not.toHaveProperty("responseFormat");
  });
});
