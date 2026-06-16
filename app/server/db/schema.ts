import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

const authTimestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
};

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  name: text("name").notNull(),
  image: text("image"),
  ...authTimestamps,
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...authTimestamps,
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const authAccount = sqliteTable(
  "auth_account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp",
    }),
    scope: text("scope"),
    password: text("password"),
    ...authTimestamps,
  },
  (table) => [index("auth_account_user_id_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    ...authTimestamps,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category", {
    enum: ["asset", "liability", "equity", "revenue", "expense"],
  }).notNull(),
});

export const journalEntries = sqliteTable(
  "journal_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    entryDate: text("entry_date").notNull(),
    description: text("description"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    index("journal_entries_user_date_idx").on(table.userId, table.entryDate),
  ],
);

export const journalLines = sqliteTable(
  "journal_lines",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entryId: text("entry_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "cascade" }),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id),
    side: text("side", { enum: ["debit", "credit"] }).notNull(),
    amount: integer("amount").notNull(),
    receiptKey: text("receipt_key"),
  },
  (table) => [index("journal_lines_entry_id_idx").on(table.entryId)],
);

export const entryDetails = sqliteTable(
  "entry_details",
  {
    entryId: text("entry_id")
      .primaryKey()
      .references(() => journalEntries.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["income", "expense"] }).notNull(),
    amount: integer("amount").notNull(),
    categoryCode: text("category_code").notNull(),
    deliveries: integer("deliveries"),
    onlineMinutes: integer("online_minutes"),
    receiptKey: text("receipt_key"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    index("entry_details_kind_idx").on(table.kind),
    index("entry_details_category_code_idx").on(table.categoryCode),
  ],
);

export const categoryRatios = sqliteTable(
  "category_ratios",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id),
    businessRatio: integer("business_ratio").notNull().default(100),
  },
  (table) => [
    unique("category_ratios_user_account_uq").on(table.userId, table.accountId),
  ],
);

export const fixedAssets = sqliteTable("fixed_assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  acquiredOn: text("acquired_on").notNull(),
  cost: integer("cost").notNull(),
  usefulLifeYears: integer("useful_life_years").notNull(),
  method: text("method").notNull().default("straight_line"),
  businessRatio: integer("business_ratio").notNull().default(100),
  accountId: integer("account_id").references(() => accounts.id),
});

export const dailyStats = sqliteTable(
  "daily_stats",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    statDate: text("stat_date").notNull(),
    deliveries: integer("deliveries"),
    onlineMinutes: integer("online_minutes"),
  },
  (table) => [
    unique("daily_stats_user_date_uq").on(table.userId, table.statDate),
  ],
);
