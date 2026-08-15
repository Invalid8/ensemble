import { NextRequest, NextResponse } from "next/server";
import catalogJson from "@/data/catalog.json";
import { composeLook, getColorSeason, getPaletteForSeason } from "@/lib/composer";
import type { LookProfile, Product } from "@/lib/types";

// Dev-only composer harness: runs the full Look Composer against the real catalog with
// synthetic LookProfiles - the end-to-end test for everything downstream of the API captures.
//   GET /api/dev/compose            → list presets
//   GET /api/dev/compose?preset=x   → { profile, look }
// The `no-skin` preset is the deletion test (SPEC §1): no scan → the look visibly collapses.

const catalog = catalogJson as Product[];

function score(ui: number) {
  return { ui, raw: ui / 100 };
}

function skinProfile(opts: {
  undertone: "warm" | "cool" | "neutral";
  depth: "light-medium" | "medium-deep";
  conditions?: Partial<Record<"redness" | "oiliness" | "moisture" | "radiance" | "spots" | "texture", number>>;
  skinType: LookProfile["skinType"];
  occasion: string;
  safetyFlags?: LookProfile["safetyFlags"];
  climateSeason?: string;
  focusAreas?: string[];
  wardrobe?: LookProfile["wardrobe"];
}): LookProfile {
  const season = getColorSeason(opts.undertone, opts.depth);
  const c = { redness: 80, oiliness: 80, moisture: 80, radiance: 80, spots: 80, texture: 80, ...opts.conditions };
  return {
    undertone: opts.undertone,
    tone: opts.depth,
    colorSeason: season,
    palette: getPaletteForSeason(season),
    avoidColors: [],
    skinConditions: {
      redness: score(c.redness),
      oiliness: score(c.oiliness),
      moisture: score(c.moisture),
      radiance: score(c.radiance),
      spots: score(c.spots),
      texture: score(c.texture),
    },
    skinFocusAreas: opts.focusAreas ?? [],
    skinType: opts.skinType,
    skinGoals: [],
    safetyFlags: opts.safetyFlags,
    bodyShape: "rectangle",
    size: "M",
    fitPref: "regular",
    occasion: opts.occasion,
    country: "NG",
    climateSeason: opts.climateSeason ?? "wet",
    // The app requires a wardrobe before it will continue, so the harness sets one too -
    // without it the composer draws from both wardrobes and returns mixed-gender outfits.
    wardrobe: opts.wardrobe ?? "women",
  };
}

const PRESETS: Record<string, LookProfile> = {
  // The demo-arc profile (SPEC §23): cool-toned, cheek redness, dry skin, dinner tonight.
  // Expect: warm reds dropped near face (emerald/royal-blue top), soothing + hydrating skincare,
  // dewy base, lip harmonized to the top.
  "cool-deep-redness-dinner": skinProfile({
    undertone: "cool",
    depth: "medium-deep",
    conditions: { redness: 30, moisture: 40 },
    skinType: "dry",
    occasion: "dinner",
    focusAreas: ["cheek redness"],
  }),

  // Warm + oily + interview: expect blazer layer, matte base, oil-control gel, tailored pieces.
  "warm-light-oily-interview": skinProfile({
    undertone: "warm",
    depth: "light-medium",
    conditions: { oiliness: 35 },
    skinType: "oily",
    occasion: "interview",
    wardrobe: "men",
  }),

  // Safety-suppression path: pregnant + sensitive - actives like salicylic/retinoids must vanish.
  "pregnant-sensitive-wedding": skinProfile({
    undertone: "neutral",
    depth: "medium-deep",
    conditions: { spots: 40 },
    skinType: "sensitive",
    occasion: "wedding-guest",
    safetyFlags: { pregnant: true, breastfeeding: false, sensitivities: ["fragrance"], activeTreatment: false, allergies: [] },
  }),

  // Harmattan climate: hydrating/occlusive skincare must appear even with healthy moisture scores.
  "warm-deep-harmattan-office": skinProfile({
    undertone: "warm",
    depth: "medium-deep",
    skinType: "combo",
    occasion: "office",
    climateSeason: "dry-harmattan",
  }),

  // THE DELETION TEST (SPEC §1): no skin scan → no palette, no conditions. The look must
  // visibly degrade - this failing to degrade would mean the APIs aren't load-bearing.
  "no-skin": {
    occasion: "dinner",
    skinType: "combo",
    bodyShape: "rectangle",
    size: "M",
    fitPref: "regular",
    country: "NG",
    climateSeason: "wet",
    wardrobe: "women",
  },
};

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "dev-only route" }, { status: 404 });
  }
  const preset = request.nextUrl.searchParams.get("preset");
  if (!preset) {
    return NextResponse.json({ presets: Object.keys(PRESETS), usage: "GET /api/dev/compose?preset=<name>" });
  }
  const profile = PRESETS[preset];
  if (!profile) {
    return NextResponse.json({ error: `unknown preset "${preset}"`, presets: Object.keys(PRESETS) }, { status: 400 });
  }
  const look = composeLook(profile, catalog);
  return NextResponse.json({ preset, profile, look });
}
