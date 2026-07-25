import { eq } from "drizzle-orm";
import { db } from "./index";
import { apiCache } from "./schema";

// A missing or unreachable DB degrades to a plain cache miss - the app keeps working.
export async function getCached<T>(key: string): Promise<T | null> {
  if (!db) return null;
  try {
    const [row] = await db.select().from(apiCache).where(eq(apiCache.key, key)).limit(1);
    if (!row) return null;
    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;
    return row.value as T;
  } catch {
    return null;
  }
}

export async function setCached(key: string, source: string, value: unknown, ttlSeconds?: number): Promise<void> {
  if (!db) return;
  const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;
  try {
    await db
      .insert(apiCache)
      .values({ key, source, value, expiresAt })
      .onConflictDoUpdate({ target: apiCache.key, set: { value, expiresAt, createdAt: new Date() } });
  } catch {
    // a failed cache write must never fail the request
  }
}

export async function withCache<T>(
  key: string,
  source: string,
  ttlSeconds: number | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const hit = await getCached<T>(key);
  if (hit !== null) return hit;
  const value = await fn();
  await setCached(key, source, value, ttlSeconds);
  return value;
}
