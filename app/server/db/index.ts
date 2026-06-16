import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function createDrizzleClient(d1: D1Database) {
  return drizzle(d1, { schema });
}

export async function getDB() {
  const { env } = await getCloudflareContext({ async: true });
  return createDrizzleClient(env.DB);
}

export type DrizzleClient = ReturnType<typeof createDrizzleClient>;
export type Account = typeof schema.accounts.$inferSelect;
export type JournalEntry = typeof schema.journalEntries.$inferSelect;
export type JournalLine = typeof schema.journalLines.$inferSelect;
export type DailyStat = typeof schema.dailyStats.$inferSelect;
export type EntryDetail = typeof schema.entryDetails.$inferSelect;
