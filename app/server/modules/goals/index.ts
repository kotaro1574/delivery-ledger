import { zValidator } from "@hono/zod-validator";
import { createApp } from "@server/factory";
import { requireAuth } from "@server/lib/auth-utils";
import { GoalsModel } from "./model";
import { GoalsService } from "./service";

export const GoalsApp = createApp()
  .put(
    "/:month",
    zValidator("param", GoalsModel.MonthParam),
    zValidator("json", GoalsModel.UpsertRequest),
    async (c) => {
      const session = await requireAuth(c.req.raw.headers);
      const { month } = c.req.valid("param");
      const { targetAmount } = c.req.valid("json");
      const result = await GoalsService.upsert(
        session.user.id,
        month,
        targetAmount,
      );
      return c.json(result);
    },
  )
  .delete("/:month", zValidator("param", GoalsModel.MonthParam), async (c) => {
    const session = await requireAuth(c.req.raw.headers);
    const { month } = c.req.valid("param");
    const result = await GoalsService.remove(session.user.id, month);
    return c.json(result);
  });
