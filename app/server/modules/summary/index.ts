import { zValidator } from "@hono/zod-validator";
import { createApp } from "@server/factory";
import { requireAuth } from "@server/lib/auth-utils";
import { SummaryModel } from "./model";
import { SummaryService } from "./service";

export const SummaryApp = createApp().get(
  "/",
  zValidator("query", SummaryModel.Query),
  async (c) => {
    const session = await requireAuth(c.req.raw.headers);
    const query = c.req.valid("query");
    const result = await SummaryService.monthly(session.user.id, query.month);
    return c.json(result);
  },
);
