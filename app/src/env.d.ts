interface CloudflareEnv {
  DB: D1Database;
  RECEIPTS: R2Bucket;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  UPLOAD_MODE?: "local" | "worker" | "presigned";
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  R2_BUCKET_NAME?: string;
  GEMINI_API_KEY?: string;
  GEMINI_OCR_MODEL?: string;
}
