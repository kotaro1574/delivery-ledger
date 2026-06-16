import { ApplicationError } from "@server/lib/errors";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

export const createApp = () => {
  const app = new Hono();

  app.use("*", logger());
  app.use("*", prettyJSON());

  app.onError((error, c) => {
    console.error(error);

    if (error instanceof ApplicationError) {
      return error.toResponse();
    }

    return c.json(
      { code: "INTERNAL_ERROR", message: "Internal Server Error" },
      500,
    );
  });

  return app;
};
