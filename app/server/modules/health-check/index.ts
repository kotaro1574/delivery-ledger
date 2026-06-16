import { createApp } from "@server/factory";

export const HealthCheckApp = createApp().get("/", (c) => {
  return c.json({ ok: true });
});
