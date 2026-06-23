import { z } from "zod";

const DEFAULT_GEMINI_OCR_MODEL = "gemini-3.1-flash-lite";

const categoryRules = [
  {
    code: "601",
    keywords: [
      "ガソリン",
      "軽油",
      "燃料",
      "充電",
      "急速充電",
      "駐車",
      "洗車",
      "高速",
      "eneos",
      "出光",
      "apollostation",
      "cosmo",
    ],
  },
  {
    code: "603",
    keywords: [
      "スマホ",
      "携帯",
      "通信",
      "sim",
      "モバイル",
      "楽天モバイル",
      "iijmio",
      "povo",
      "ahamo",
      "linemo",
    ],
  },
  {
    code: "604",
    keywords: [
      "バッグ",
      "文具",
      "備品",
      "消耗品",
      "手袋",
      "雨具",
      "モバイルバッテリー",
    ],
  },
  {
    code: "605",
    keywords: ["保険", "損害保険", "自転車保険", "任意保険"],
  },
  {
    code: "606",
    keywords: ["修理", "メンテ", "整備", "タイヤ", "パンク", "交換"],
  },
] as const;

type CategoryCode = (typeof categoryRules)[number]["code"] | "699";

const receiptItemSchema = z.object({
  item_name: z.string().nullable(),
  amount: z.number().nullable(),
});

const geminiReceiptSchema = z.object({
  store_name: z.string().nullable(),
  items: z.array(receiptItemSchema),
  total_amount: z.number().nullable(),
  date: z.string().nullable(),
  confidence: z.number(),
});

type GeminiReceipt = z.infer<typeof geminiReceiptSchema>;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type AnalyzeReceiptParams = {
  file: File;
  apiKey: string;
  model?: string;
};

export type ReceiptOcrAnalysis = {
  amount: number | null;
  date: string | null;
  storeName: string | null;
  categoryCode: CategoryCode;
  memo: string;
  confidence: number;
};

const receiptJsonSchema = {
  type: "object",
  properties: {
    store_name: { type: "string", nullable: true },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item_name: { type: "string", nullable: true },
          amount: { type: "number", nullable: true },
        },
        required: ["item_name", "amount"],
      },
    },
    total_amount: { type: "number", nullable: true },
    date: { type: "string", nullable: true },
    confidence: { type: "number" },
  },
  required: ["store_name", "items", "total_amount", "date", "confidence"],
} as const;

const receiptPrompt = `店舗レシートまたは領収書の画像から、配達事業の経費入力に必要な情報をJSONだけで抽出してください。
抽出項目:
- store_name: 店舗名または発行元
- items: 品目配列。品目が読めない場合は空配列
- total_amount: 税込の合計金額
- date: 購入日。YYYY-MM-DD形式
- confidence: 0から1の読み取り信頼度
金額には通貨記号やカンマを含めず数値にしてください。`;

function normalizeText(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}

function isSupportedImage(type: string): boolean {
  return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(type);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function extractText(response: GeminiResponse): string {
  const text = response.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error(response.error?.message ?? "Gemini OCR response is empty");
  }

  return text;
}

function parseGeminiReceipt(text: string): GeminiReceipt {
  const parsed = JSON.parse(text) as unknown;
  return geminiReceiptSchema.parse(parsed);
}

function validDate(value: string | null): string | null {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function buildMemo(data: GeminiReceipt): string {
  return [
    data.store_name,
    ...data.items
      .map((item) => item.item_name)
      .filter((name): name is string => Boolean(name?.trim()))
      .slice(0, 2),
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ");
}

function toAnalysis(data: GeminiReceipt): ReceiptOcrAnalysis {
  const itemNames = data.items
    .map((item) => item.item_name)
    .filter((name): name is string => Boolean(name?.trim()));

  return {
    amount: data.total_amount,
    date: validDate(data.date),
    storeName: data.store_name,
    categoryCode: classifyExpenseCategory({
      storeName: data.store_name,
      items: itemNames,
    }),
    memo: buildMemo(data),
    confidence: data.confidence,
  };
}

export function classifyExpenseCategory(input: {
  storeName: string | null;
  items: string[];
}): CategoryCode {
  const text = normalizeText([input.storeName, ...input.items].join(" "));
  const matched = categoryRules.find((rule) =>
    rule.keywords.some((keyword) => text.includes(normalizeText(keyword))),
  );

  return matched?.code ?? "699";
}

export async function analyzeReceiptWithGemini({
  file,
  apiKey,
  model = DEFAULT_GEMINI_OCR_MODEL,
}: AnalyzeReceiptParams): Promise<ReceiptOcrAnalysis> {
  if (!isSupportedImage(file.type)) {
    throw new Error("対応していない画像形式です");
  }

  const base64 = arrayBufferToBase64(await file.arrayBuffer());
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: receiptPrompt },
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: receiptJsonSchema,
        },
      }),
    },
  );

  const payload = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Gemini OCR request failed");
  }

  return toAnalysis(parseGeminiReceipt(extractText(payload)));
}
