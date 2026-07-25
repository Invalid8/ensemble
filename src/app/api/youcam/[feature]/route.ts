import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { runYouCamWorkflow, fetchImageBytes, YouCamApiError } from "@/lib/youcam/client";
import { withCache } from "@/lib/db/cache";

export const runtime = "nodejs";

// Same image + feature is deterministic, so re-running a photo costs zero API units.
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
// Cloth returns a signed S3 URL valid ~2h, so its cache must expire well inside that window.
const CLOTH_TTL_SECONDS = 60 * 90;

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const ALLOWED_FEATURES = new Set(["skin-analysis", "skin-tone-analysis", "cloth"]);

// Mock mode (no YOUCAM_API_KEY): canned responses in the live field shapes, so the flow
// is testable without the key and flips to the real API with no code change.
function mockScore(ui: number) {
  return { ui_score: ui, raw_score: ui / 100 };
}

async function mockResponse(feature: string, file: File): Promise<Record<string, unknown>> {
  if (feature === "skin-tone-analysis") {
    return { mock: true, skin_color: "#8D5A3B", eye_color: "#4A2C1A", eye_color_name: "Brown", hair_color: "#1E1611", hair_color_name: "Black", lip_color: "#8E5A50", eyebrow_color: "#2A1D14" };
  }
  if (feature === "skin-analysis") {
    return {
      mock: true,
      all: { score: 78 },
      skin_age: 27,
      redness: mockScore(42),
      oiliness: mockScore(72),
      moisture: mockScore(44),
      radiance: mockScore(66),
      age_spot: mockScore(81),
      texture: mockScore(74),
      skin_type: { value: "Combination" },
    };
  }
  // cloth VTO mock: echo the body photo back rather than fabricate a try-on.
  const bytes = Buffer.from(await file.arrayBuffer());
  return { mock: true, results: { url: `data:${file.type || "image/jpeg"};base64,${bytes.toString("base64")}` } };
}

// Flatten the live API's per-feature results into the shape the UI + mock share.
function normalize(feature: string, results: Record<string, unknown> | null): Record<string, unknown> {
  const r = results ?? {};
  if (feature === "skin-tone-analysis") {
    return { ...((r.color as Record<string, unknown>) ?? {}) };
  }
  if (feature === "skin-analysis") {
    const output = (r.output as { type: string; ui_score: number; raw_score: number }[]) ?? [];
    const byType: Record<string, unknown> = {};
    for (const o of output) {
      byType[o.type] = o.type === "skin_type" ? { ...o } : { ui_score: o.ui_score, raw_score: o.raw_score };
    }
    return byType;
  }
  if (feature === "cloth") {
    return { results: r };
  }
  return r;
}

const ERROR_MESSAGES: Record<string, string> = {
  error_src_face_too_small: "Get a little closer - your face should fill more of the frame.",
  error_face_not_forward_facing: "Look straight at the camera and try again.",
  error_src_no_face: "We couldn't find a face - try a clearer selfie.",
  error_src_face_lighting: "The light's a little tricky - try facing a window.",
};

function friendlyError(code: string | null): string {
  return (code && ERROR_MESSAGES[code]) || "We couldn't read that photo - mind trying another?";
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ feature: string }> }) {
  const { feature } = await params;

  if (!ALLOWED_FEATURES.has(feature)) {
    return NextResponse.json({ error: `Unknown feature: ${feature}` }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const taskParamsRaw = formData.get("taskParams");
  const taskParams = typeof taskParamsRaw === "string" ? JSON.parse(taskParamsRaw) : {};

  const refImageUrlRaw = formData.get("refImageUrl");
  const refImageUrl = typeof refImageUrlRaw === "string" && refImageUrlRaw ? refImageUrlRaw : null;

  if (!process.env.YOUCAM_API_KEY) {
    return NextResponse.json(await mockResponse(feature, file));
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha256").update(bytes).update(JSON.stringify(taskParams ?? {}));
  if (refImageUrl) hash.update(refImageUrl);
  const cacheKey = `youcam:${feature}:${hash.digest("hex")}`;
  const ttl = feature === "cloth" ? CLOTH_TTL_SECONDS : CACHE_TTL_SECONDS;

  try {
    const normalized = await withCache(cacheKey, "youcam", ttl, async () => {
      const ref = refImageUrl ? await fetchImageBytes(refImageUrl) : null;
      const result = await runYouCamWorkflow({
        feature,
        fileBytes: bytes,
        contentType: file.type || "application/octet-stream",
        refBytes: ref?.bytes,
        refContentType: ref?.contentType,
        buildTaskPayload: (fileId, refFileId) => ({
          src_file_id: fileId,
          ...(refFileId ? { ref_file_id: refFileId } : {}),
          ...taskParams,
        }),
      });
      if (result.task_status === "error") {
        throw new HttpError(422, friendlyError(result.error)); // don't cache task failures
      }
      return normalize(feature, result.results);
    });
    return NextResponse.json(normalized);
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`[youcam:${feature}]`, err);
    const offline = err instanceof YouCamApiError && err.statusCode === 0;
    const message = offline
      ? "We couldn't reach the studio - check your connection and try again."
      : "Something slipped on our end. Give it a moment and try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
