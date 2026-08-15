import type { NextRequest } from "next/server";
import { getCached, setCached } from "@/lib/db/cache";

// The YouCam key is a fixed pool of units. One look burns 3-4 of them (two skin reads plus
// one or two try-on renders), so a handful of people re-running the flow for fun would drain
// the demo budget. Cap the number of looks per visitor per rolling window.
const LOOK_LIMIT = Number(process.env.YOUCAM_LOOK_LIMIT ?? 3);
const WINDOW_HOURS = Number(process.env.YOUCAM_QUOTA_WINDOW_HOURS ?? 12);
const WINDOW_MS = WINDOW_HOURS * 60 * 60 * 1000;

// Every look begins with exactly one tone read, so counting that feature counts looks -
// the follow-up skin-analysis and cloth calls ride along on the same allowance.
const COUNTED_FEATURE = "skin-tone-analysis";

interface Usage {
  count: number;
  resetAt: number;
}

export interface QuotaVerdict {
  allowed: boolean;
  used: number;
  limit: number;
  retryAfterMinutes: number;
}

// In-memory is the fast path and the only path when there's no DB; the cache table mirrors it
// so the count survives a server restart or a recycled serverless instance.
const memory = new Map<string, Usage>();

function storageKey(visitor: string) {
  return `quota:youcam:${visitor}`;
}

/**
 * Best-effort visitor identity. A shared NAT collapses a whole office into one bucket, which
 * for a demo budget errs the right way - we would rather under-serve than drain the pool.
 */
export function visitorId(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim();
  return ip || "local";
}

async function read(visitor: string): Promise<Usage | null> {
  const now = Date.now();
  const cached = memory.get(visitor);
  if (cached) {
    if (cached.resetAt > now) return cached;
    memory.delete(visitor);
  }
  const stored = await getCached<Usage>(storageKey(visitor));
  if (stored && stored.resetAt > now) {
    memory.set(visitor, stored);
    return stored;
  }
  return null;
}

function minutesUntil(resetAt: number) {
  return Math.max(1, Math.ceil((resetAt - Date.now()) / 60000));
}

/** Read-only check. Runs before any work so an over-quota visitor never touches the API. */
export async function checkQuota(visitor: string): Promise<QuotaVerdict> {
  if (LOOK_LIMIT <= 0) {
    return { allowed: true, used: 0, limit: LOOK_LIMIT, retryAfterMinutes: 0 };
  }
  const usage = await read(visitor);
  if (!usage) return { allowed: true, used: 0, limit: LOOK_LIMIT, retryAfterMinutes: 0 };
  return {
    allowed: usage.count < LOOK_LIMIT,
    used: usage.count,
    limit: LOOK_LIMIT,
    retryAfterMinutes: minutesUntil(usage.resetAt),
  };
}

/**
 * Charge one look. Called only once the request has actually spent units - a cache hit on a
 * repeated photo costs nothing, so it must not cost the visitor an allowance either.
 */
export async function recordLook(visitor: string, feature: string): Promise<void> {
  if (LOOK_LIMIT <= 0 || feature !== COUNTED_FEATURE) return;
  const existing = await read(visitor);
  const next: Usage = existing
    ? { count: existing.count + 1, resetAt: existing.resetAt }
    : { count: 1, resetAt: Date.now() + WINDOW_MS };
  memory.set(visitor, next);
  const ttlSeconds = Math.ceil((next.resetAt - Date.now()) / 1000);
  await setCached(storageKey(visitor), "quota", next, ttlSeconds);
}

export function quotaMessage(verdict: QuotaVerdict): string {
  const hours = Math.round(verdict.retryAfterMinutes / 60);
  const when = hours >= 2 ? `in about ${hours} hours` : "in about an hour";
  return `That's ${verdict.limit} looks for now. Our studio runs on a small pool of scans, so take a breather and come back ${when}.`;
}
