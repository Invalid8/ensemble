import type { NextRequest } from "next/server";
import { getCached, setCached } from "@/lib/db/cache";

// The YouCam key is a fixed pool of units. One look burns up to 4 of them (two skin reads plus
// one or two try-on renders), so a handful of people re-running the flow for fun would drain
// the demo budget. Cap the units a visitor can spend per rolling window, expressed as looks.
const LOOK_LIMIT = Number(process.env.YOUCAM_LOOK_LIMIT ?? 3);
const WINDOW_HOURS = Number(process.env.YOUCAM_QUOTA_WINDOW_HOURS ?? 12);
const WINDOW_MS = WINDOW_HOURS * 60 * 60 * 1000;

// Worst case for one look: skin-tone + skin-analysis + a top render + a trouser render.
const UNITS_PER_LOOK = 4;
const UNIT_LIMIT = LOOK_LIMIT * UNITS_PER_LOOK;

// Every look begins with exactly one tone read, so that feature marks a look starting - and
// it is the only call that has to reserve a whole look's worth of units up front.
const LOOK_START_FEATURE = "skin-tone-analysis";

interface Usage {
  units: number;
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

// v2: the stored counter changed from looks to units, so old rows must not be read as units.
function storageKey(visitor: string) {
  return `quota:youcam:v2:${visitor}`;
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

function verdict(allowed: boolean, usage: Usage | null): QuotaVerdict {
  return {
    allowed,
    used: Math.floor((usage?.units ?? 0) / UNITS_PER_LOOK),
    limit: LOOK_LIMIT,
    retryAfterMinutes: usage ? minutesUntil(usage.resetAt) : 0,
  };
}

/**
 * Read-only check. Runs before any work so an over-quota visitor never touches the API.
 *
 * A look is allowed to *finish*: starting one reserves a whole look's worth of units, so the
 * skin-analysis and try-on renders that follow always have budget left and never get refused
 * halfway through - the failure mode that used to drop a visitor back to a catalog photo with
 * no explanation. Follow-up calls still spend units, so re-rendering try-ons stays bounded.
 */
export async function checkQuota(visitor: string, feature: string): Promise<QuotaVerdict> {
  if (LOOK_LIMIT <= 0) return verdict(true, null);

  const usage = await read(visitor);
  if (!usage) return verdict(true, null);

  const needed = feature === LOOK_START_FEATURE ? UNITS_PER_LOOK : 1;
  return verdict(usage.units + needed <= UNIT_LIMIT, usage);
}

/**
 * Charge spent units. Called only once the request has actually spent units - a cache hit on a
 * repeated photo costs nothing, so it must not cost the visitor an allowance either.
 */
export async function recordUsage(visitor: string, units = 1): Promise<void> {
  if (LOOK_LIMIT <= 0 || units <= 0) return;
  const existing = await read(visitor);
  const next: Usage = existing
    ? { units: existing.units + units, resetAt: existing.resetAt }
    : { units, resetAt: Date.now() + WINDOW_MS };
  memory.set(visitor, next);
  const ttlSeconds = Math.ceil((next.resetAt - Date.now()) / 1000);
  await setCached(storageKey(visitor), "quota", next, ttlSeconds);
}

export function quotaMessage(verdict: QuotaVerdict): string {
  const hours = Math.round(verdict.retryAfterMinutes / 60);
  const when = hours >= 2 ? `in about ${hours} hours` : "in about an hour";
  return `That's ${verdict.limit} looks for now. Our studio runs on a small pool of scans, so take a breather and come back ${when}.`;
}
