import { NextRequest, NextResponse } from "next/server";
import { runYouCamWorkflow } from "@/lib/youcam/client";

// SPEC.md.md §8 - universal 4-step workflow, one route handles all three features.
const ALLOWED_FEATURES = new Set(["skin-analysis", "skin-tone-analysis", "cloth"]);

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
