import {
  deriveUndertoneAndDepth,
  getColorSeason,
  getPaletteForSeason,
} from "@/lib/composer";
import type { LookProfile, Product, SkinConditions } from "@/lib/types";
import { FOCUS_LABELS, STRENGTH_LABELS } from "@/lib/studio/constants";
import { compressForUpload } from "@/lib/studio/compress";
import type { SkinRead } from "@/lib/studio/types";

const CONCERNS = ["redness", "oiliness", "moisture", "radiance", "age_spot", "texture", "skin_type"];

/** The visitor has spent their allowance of looks - a different screen, not an error note. */
export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

async function postYouCam(
  feature: string,
  file: File,
  taskParams?: Record<string, unknown>,
  extra?: { refImageUrl?: string; vtoLayers?: VtoLayer[]; personUrl?: string }
) {
  const form = new FormData();
  form.append("file", file);
  if (taskParams) form.append("taskParams", JSON.stringify(taskParams));
  if (extra?.refImageUrl) form.append("refImageUrl", extra.refImageUrl);
  if (extra?.vtoLayers) form.append("vtoLayers", JSON.stringify(extra.vtoLayers));
  if (extra?.personUrl) form.append("personUrl", extra.personUrl);

  const res = await fetch(`/api/youcam/${feature}`, { method: "POST", body: form });

  // A killed function answers with HTML, not our JSON - parse blind and the SyntaxError buries the cause.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: Record<string, any> = {};
  try {
    json = await res.json();
  } catch {
    if (!res.ok) {
      throw new Error(
        res.status === 504 || res.status === 408
          ? "The try-on took too long to come back."
          : `${feature} failed (${res.status})`
      );
    }
  }

  if (res.status === 429 || json.code === "rate_limited") throw new QuotaError(json.error ?? "");
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
  // Compress once here rather than inside postYouCam - the two reads share one photo.
  const upload = await compressForUpload(file);

  // Tone drives the palette and is the essential read; HD skin analysis is best-effort,
  // since it needs a closer face and can fail ("too small") on a photo tone accepts fine.
  const [toneR, skinR] = await Promise.allSettled([
    postYouCam("skin-tone-analysis", upload, { face_angle_strictness_level: "medium" }),
    postYouCam("skin-analysis", upload, { dst_actions: CONCERNS, format: "json" }),
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

interface VtoLayer {
  url: string;
  category: string;
}

function garmentCategory(subcategory?: string): string {
  const s = (subcategory ?? "").toLowerCase();
  if (/dress|jumpsuit|gown|romper|playsuit|overall/.test(s)) return "full_body";
  if (/trouser|pant|jean|skirt|short|legging|culotte/.test(s)) return "lower_body";
  return "upper_body";
}

// A dress is one full-body render; separates chain a top then a bottom so both show on the body.
// The server renders the layers in order, feeding each result into the next.
function buildLayers(garments: Product[]): VtoLayer[] {
  const withCat = garments
    .filter((g) => g.image_url)
    .map((g) => ({ url: g.image_url, category: garmentCategory(g.subcategory) }));

  const dress = withCat.find((l) => l.category === "full_body");
  if (dress) return [{ url: dress.url, category: "full_body" }];

  const upper = withCat.find((l) => l.category === "upper_body");
  const lower = withCat.find((l) => l.category === "lower_body");
  return [upper, lower].filter((l): l is VtoLayer => Boolean(l));
}

/**
 * One request per garment, each render feeding the next as the person. Chaining the whole outfit
 * in one request measured ~48s and died on Vercel's 60s ceiling; a layer at a time is ~25s.
 */
export async function renderVto(
  bodyFile: File,
  garments: Product[],
  onLayer?: (index: number, total: number) => void
): Promise<VtoResult> {
  const layers = buildLayers(garments);
  if (!layers.length) return { url: null, mock: false };

  const person = await compressForUpload(bodyFile);
  let url: string | null = null;
  let mock = false;

  for (let i = 0; i < layers.length; i++) {
    onLayer?.(i, layers.length);
    const vto = await postYouCam("cloth", person, undefined, {
      vtoLayers: [layers[i]],
      // First layer dresses the photo, the rest dress the render before it (mock echoes a data: URL).
      ...(url?.startsWith("https://") ? { personUrl: url } : {}),
    });

    mock = mock || Boolean(vto.mock);
    const next = vto.results?.url ?? null;
    // an empty layer still leaves the visitor wearing the earlier ones
    if (!next) break;
    url = next;
  }

  return { url, mock };
}
