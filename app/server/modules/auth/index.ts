import { createApp } from "@server/factory";
import { getAuth } from "@server/lib/auth";

export const AuthApp = createApp().on(["POST", "GET"], "/*", async (c) => {
  const auth = await getAuth();
  return auth.handler(c.req.raw);
});
