import { getCloudflareContext } from "@opennextjs/cloudflare";
import { BadRequestError } from "@server/lib/errors";
import { buildReceiptKey, getReceiptsBucket } from "@server/lib/r2";
import { createPresignedReceiptUploadUrl } from "@server/lib/r2-presign";
import type { ReceiptsModel } from "./model";
import { analyzeReceiptWithGemini } from "./ocr";

export const ReceiptsService = {
  async createUploadUrl(
    userId: string,
    input: ReceiptsModel.UploadUrlRequest,
  ): Promise<ReceiptsModel.UploadUrlResponse> {
    const { env } = await getCloudflareContext({ async: true });
    const key = buildReceiptKey(userId, crypto.randomUUID(), input.contentType);

    if (env.UPLOAD_MODE === "local") {
      return {
        key,
        url: `/api/receipts/local-upload?key=${encodeURIComponent(key)}`,
      };
    }

    return {
      key,
      url: await createPresignedReceiptUploadUrl(key),
    };
  },

  async putLocal(key: string, request: Request) {
    const bucket = await getReceiptsBucket();
    const contentType =
      request.headers.get("content-type") ?? "application/octet-stream";
    await bucket.put(key, await request.arrayBuffer(), {
      httpMetadata: { contentType },
    });
    return { ok: true };
  },

  async analyzeReceipt(file: File): Promise<ReceiptsModel.AnalyzeResponse> {
    const { env } = await getCloudflareContext({ async: true });

    if (!env.GEMINI_API_KEY) {
      throw new BadRequestError(
        "Gemini APIキーが未設定です。手動入力を使ってください。",
      );
    }

    try {
      return await analyzeReceiptWithGemini({
        file,
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_OCR_MODEL,
      });
    } catch (error) {
      throw new BadRequestError(
        error instanceof Error ? error.message : "レシートの解析に失敗しました",
      );
    }
  },
};
