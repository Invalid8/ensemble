import { NextRequest, NextResponse } from "next/server";
import { runYouCamWorkflow } from "@/lib/youcam/client";

// SPEC.md.md §8 - universal 4-step workflow, one route handles all three features.
const ALLOWED_FEATURES = new Set(["skin-analysis", "skin-tone-analysis", "cloth"]);

// Mock mode: no YOUCAM_API_KEY → return canned responses shaped like the confirmed live
// fields (DEVELOPMENT.md §6), so the full UI flow is end-to-end testable before the key is
// redeemed and flips to the real API without code changes. `mock: true` lets the UI badge it.
function mockScore(ui: number) {
  return { ui_score: ui, raw_score: ui / 100 };
}

async function mockResponse(feature: string, file: File): Promise<Record<string, unknown>> {
  if (feature === "skin-tone-analysis") {
    // Medium-deep warm skin — exercises the deep-tone path (SPEC §19) by default.
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
  // cloth VTO: echo the uploaded body photo back as a data URL — an honest placeholder
  // ("your photo, garment render pending") rather than a fabricated try-on.
  const bytes = Buffer.from(await file.arrayBuffer());
  return { mock: true, results: { url: `data:${file.type || "image/jpeg"};base64,${bytes.toString("base64")}` } };
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

  if (!process.env.YOUCAM_API_KEY) {
    return NextResponse.json(await mockResponse(feature, file));
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const result = await runYouCamWorkflow({
      feature,
      fileBytes: bytes,
      contentType: file.type || "application/octet-stream",
      buildTaskPayload: (fileId) => ({ src_file_id: fileId, ...taskParams }),
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
