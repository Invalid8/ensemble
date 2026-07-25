import {
  deriveUndertoneAndDepth,
  getColorSeason,
  getPaletteForSeason,
} from "@/lib/composer";
import type { LookProfile, Product, SkinConditions } from "@/lib/types";
import { FOCUS_LABELS, STRENGTH_LABELS } from "@/lib/studio/constants";
import type { SkinRead } from "@/lib/studio/types";

const CONCERNS = ["redness", "oiliness", "moisture", "radiance", "age_spot", "texture", "skin_type"];

async function postYouCam(feature: string, file: File, taskParams?: Record<string, unknown>) {
  const form = new FormData();
  form.append("file", file);
  if (taskParams) form.append("taskParams", JSON.stringify(taskParams));

  const res = await fetch(`/api/youcam/${feature}`, { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `${feature} failed`);
  return json;
}

function scoreOf(raw: unknown): { ui: number; raw: number } {
  const r = raw as { ui_score?: number; raw_score?: number } | undefined;
  return { ui: r?.ui_score ?? 75, raw: r?.raw_score ?? 0.75 };
}

export interface SkinReadResult {
  profilePatch: Partial<LookProfile>;
  skinRead: SkinRead;
}

export async function readSkin(file: File): Promise<SkinReadResult> {
  // Tone drives the palette and is the essential read; HD skin analysis is best-effort,
  // since it needs a closer face and can fail ("too small") on a photo tone accepts fine.
  const [toneR, skinR] = await Promise.allSettled([
    postYouCam("skin-tone-analysis", file, { face_angle_strictness_level: "medium" }),
    postYouCam("skin-analysis", file, { dst_actions: CONCERNS, format: "json" }),
  ]);

  if (toneR.status === "rejected") throw toneR.reason;
  const tone = toneR.value;
  const skin = skinR.status === "fulfilled" ? skinR.value : null;

  const { undertone, depth } = deriveUndertoneAndDepth(tone.skin_color ?? "#8D5A3B");
  const season = getColorSeason(undertone, depth);

  const conditions: SkinConditions = {
    redness: scoreOf(skin?.redness),
    oiliness: scoreOf(skin?.oiliness),
    moisture: scoreOf(skin?.moisture),
    radiance: scoreOf(skin?.radiance),
    spots: scoreOf(skin?.age_spot),
    texture: scoreOf(skin?.texture),
  };

  let focusAreas: string[] = [];
  let strengths: string[] = [];
  let detectedSkinType: LookProfile["skinType"] | undefined;

  if (skin) {
    const ranked = Object.entries(conditions).sort((a, b) => a[1].ui - b[1].ui);
    focusAreas = ranked.filter(([, s]) => s.ui < 50).slice(0, 3).map(([k]) => FOCUS_LABELS[k]);
    strengths = ranked.filter(([, s]) => s.ui >= 65).slice(-2).map(([k]) => STRENGTH_LABELS[k]);

    const detectedRaw = String(skin.skin_type?.value ?? "").toLowerCase();
    detectedSkinType = detectedRaw.startsWith("comb")
      ? "combo"
      : detectedRaw.startsWith("oil")
        ? "oily"
        : detectedRaw.startsWith("dry")
          ? "dry"
          : undefined;
  }

  return {
    profilePatch: {
      undertone,
      tone: depth,
      colorSeason: season,
      palette: getPaletteForSeason(season),
      avoidColors: [],
      ...(skin ? { skinConditions: conditions, skinFocusAreas: focusAreas, skinType: detectedSkinType } : {}),
    },
    skinRead: {
      conditions,
      focusAreas,
      strengths,
      detectedSkinType,
      mock: Boolean(tone.mock || skin?.mock),
    },
  };
}

export interface VtoResult {
  url: string | null;
  mock: boolean;
}

export async function renderVto(bodyFile: File, garment: Product | undefined): Promise<VtoResult> {
  const vto = await postYouCam(
    "cloth",
    bodyFile,
    garment ? { ref_file_url: garment.image_url, garment_category: "full_body" } : {}
  );
  return { url: vto.results?.url ?? null, mock: Boolean(vto.mock) };
}
