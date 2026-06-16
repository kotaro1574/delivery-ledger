import { AuthApp } from "@server/modules/auth";
import { EntriesApp } from "@server/modules/entries";
import { HealthCheckApp } from "@server/modules/health-check";
import { ReceiptsApp } from "@server/modules/receipts";
import { SummaryApp } from "@server/modules/summary";
import { createApp } from "./factory";

const app = createApp().basePath("/api");

const routes = app
  .route("/auth", AuthApp)
  .route("/health-check", HealthCheckApp)
  .route("/entries", EntriesApp)
  .route("/receipts", ReceiptsApp)
  .route("/summary", SummaryApp);

export default app;
export type AppType = typeof routes;
