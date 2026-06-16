import { zValidator } from "@hono/zod-validator";
import { createApp } from "@server/factory";
import { requireAuth } from "@server/lib/auth-utils";
import { EntriesModel } from "./model";
import { EntriesService } from "./service";

export const EntriesApp = createApp()
  .post("/", zValidator("json", EntriesModel.CreateRequest), async (c) => {
    const session = await requireAuth(c.req.raw.headers);
    const body = c.req.valid("json");

    if (body.kind === "expense") {
      EntriesService.assertKnownExpenseCategory(body.categoryCode);
    }

    const result = await EntriesService.create(session.user.id, body);
    return c.json(result);
  })
  .patch("/:id", zValidator("json", EntriesModel.UpdateRequest), async (c) => {
    const session = await requireAuth(c.req.raw.headers);
    const body = c.req.valid("json");
    const entryId = c.req.param("id");

    if (body.kind === "expense") {
      EntriesService.assertKnownExpenseCategory(body.categoryCode);
    }

    const result = await EntriesService.update(session.user.id, entryId, body);
    return c.json(result);
  })
  .delete("/:id", async (c) => {
    const session = await requireAuth(c.req.raw.headers);
    const entryId = c.req.param("id");
    const result = await EntriesService.remove(session.user.id, entryId);
    return c.json(result);
  })
  .get("/", zValidator("query", EntriesModel.MonthQuery), async (c) => {
    const session = await requireAuth(c.req.raw.headers);
    const query = c.req.valid("query");
    const result = await EntriesService.list(session.user.id, query.month);
    return c.json(result);
  });
