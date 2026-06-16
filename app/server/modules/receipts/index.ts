import { zValidator } from "@hono/zod-validator";
import { createApp } from "@server/factory";
import { requireAuth } from "@server/lib/auth-utils";
import { BadRequestError } from "@server/lib/errors";
import { ReceiptsModel } from "./model";
import { ReceiptsService } from "./service";

export const ReceiptsApp = createApp()
  .post(
    "/upload-url",
    zValidator("json", ReceiptsModel.UploadUrlRequest),
    async (c) => {
      const session = await requireAuth(c.req.raw.headers);
      const body = c.req.valid("json");
      const result = await ReceiptsService.createUploadUrl(
        session.user.id,
        body,
      );
      return c.json(result);
    },
  )
  .put("/local-upload", async (c) => {
    await requireAuth(c.req.raw.headers);
    const key = new URL(c.req.url).searchParams.get("key");

    if (!key) {
      throw new BadRequestError("key が必要です");
    }

    const result = await ReceiptsService.putLocal(key, c.req.raw);
    return c.json(result);
  })
  .post("/analyze", async (c) => {
    await requireAuth(c.req.raw.headers);
    const formData = await c.req.raw.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new BadRequestError("レシート画像が必要です");
    }

    const result = await ReceiptsService.analyzeReceipt(file);
    return c.json(result);
  });
