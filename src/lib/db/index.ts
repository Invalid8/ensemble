import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// `prepare: false` keeps postgres.js compatible with Neon's transaction-mode pooler.
const url = process.env.DATABASE_URL;

const globalForDb = globalThis as unknown as { _sql?: ReturnType<typeof postgres> };

export const db = url
  ? drizzle(globalForDb._sql ?? (globalForDb._sql = postgres(url, { prepare: false })), { schema })
  : null;
