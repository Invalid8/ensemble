import { pgTable, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";

export const apiCache = pgTable(
  "api_cache",
  {
    key: text("key").primaryKey(),
    source: text("source").notNull(),
    value: jsonb("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("api_cache_source_idx").on(t.source)]
);

export type ApiCacheRow = typeof apiCache.$inferSelect;
