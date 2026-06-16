import { z } from "zod";

export namespace ReceiptsModel {
  export const UploadUrlRequest = z.object({
    contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  });
  export type UploadUrlRequest = z.infer<typeof UploadUrlRequest>;

  export const UploadUrlResponse = z.object({
    url: z.string(),
    key: z.string(),
  });
  export type UploadUrlResponse = z.infer<typeof UploadUrlResponse>;

  export const AnalyzeResponse = z.object({
    amount: z.number().nullable(),
    date: z.string().nullable(),
    storeName: z.string().nullable(),
    categoryCode: z.enum(["601", "603", "604", "605", "606", "699"]),
    memo: z.string(),
    confidence: z.number(),
  });
  export type AnalyzeResponse = z.infer<typeof AnalyzeResponse>;
}
