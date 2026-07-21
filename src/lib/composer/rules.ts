import type { LookProfile, Product, SafetyFlags, SkinConditionScore } from "@/lib/types";

// SPEC.md.md §8: ui_score/raw_score, higher = healthier. Below this threshold reads as a concern.
const CONCERN_THRESHOLD = 50;

function isLow(score: SkinConditionScore | undefined): boolean {
  return score !== undefined && score.ui < CONCERN_THRESHOLD;
}

type HueBucket = "warm-red" | "cool" | "muddy-yellow" | "neutral";

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;

  return { h, s, l };
}

// Coarse hue-family classification used only for near-face garment filtering (SPEC.md.md §6.1).
function classifyHue(hex: string): HueBucket {
  const { h, s, l } = hexToHsl(hex);
  if (s < 0.15) return "neutral";
  if (h < 40 || h >= 335) return "warm-red";
  if (h >= 40 && h < 90 && l < 0.55) return "muddy-yellow";
  if (h >= 150 && h < 260) return "cool";
  return "neutral";
}

export interface NearFaceConstraints {
  allowedPalette: string[];
  preferSolid: boolean;
}

/**
 * SPEC.md.md §6.1 - near-face garment color is filtered by skin *condition*, not just palette.
 * Returns the adjusted candidate hex list a catalog match should draw from for the near-face piece.
 */
export function getNearFaceColorConstraints(profile: LookProfile): NearFaceConstraints {
  const base = (profile.palette ?? []).filter((hex) => !(profile.avoidColors ?? []).includes(hex));
  let allowed = [...base];
  let preferSolid = false;

  const conditions = profile.skinConditions;
  if (conditions) {
    if (isLow(conditions.redness)) {
      const withoutWarmRed = allowed.filter((hex) => classifyHue(hex) !== "warm-red");
      const coolFirst = base.filter((hex) => classifyHue(hex) === "cool");
      allowed = Array.from(new Set([...coolFirst, ...withoutWarmRed]));
    }
    if (isLow(conditions.radiance)) {
      allowed = allowed.filter((hex) => classifyHue(hex) !== "muddy-yellow");
    }
    if (isLow(conditions.spots)) {
      preferSolid = true;
    }
  }

  if (allowed.length === 0) allowed = base;
  return { allowedPalette: allowed, preferSolid };
}

export type SkincareTag =
  | "hydrating-serum"
  | "rich-moisturizer"
  | "occlusive"
  | "lightweight-gel"
  | "oil-control"
  | "soothing"
  | "brightening"
  | "spf";

/** SPEC.md.md §6.2 - skin state x climate x safety. Returns product-category tags, not products. */
export function getSkincareTags(profile: LookProfile): SkincareTag[] {
  const tags = new Set<SkincareTag>();
  const conditions = profile.skinConditions;
  const isHarmattan = profile.climateSeason === "dry-harmattan";
  const isHotHumid = profile.climateSeason === "wet" || profile.climateSeason === "summer";

  if ((conditions && isLow(conditions.moisture)) || isHarmattan) {
    tags.add("hydrating-serum");
    tags.add("rich-moisturizer");
    if (isHarmattan) tags.add("occlusive");
  }
  if ((conditions && isLow(conditions.oiliness)) || isHotHumid) {
    tags.add("lightweight-gel");
    tags.add("oil-control");
  }
  if (conditions && isLow(conditions.redness)) tags.add("soothing");
  if ((conditions && isLow(conditions.spots)) || (profile.skinGoals ?? []).some((g) => /spot|even|bright/i.test(g))) {
    tags.add("brightening");
  }
  tags.add("spf");

  return Array.from(tags);
}

export interface MakeupSpec {
  lipBlushFamily: "cool-berry-rose" | "warm-terracotta-brick" | "flex-to-undertone";
  baseFinish: "dewy-hydrating" | "matte" | "natural";
  colorCorrectingPrimer: boolean;
  neutralBias: "peach-gold" | "rose-mauve" | "outfit-driven";
}

/** SPEC.md.md §6.3 - makeup coordinated to BOTH the chosen outfit color and skin state. */
export function getMakeupSpec(profile: LookProfile, nearFaceColorHex: string): MakeupSpec {
  const temperature = classifyHue(nearFaceColorHex);
  const lipBlushFamily =
    temperature === "cool" ? "cool-berry-rose" : temperature === "warm-red" || temperature === "muddy-yellow" ? "warm-terracotta-brick" : "flex-to-undertone";

  const baseFinish = profile.skinType === "dry" ? "dewy-hydrating" : profile.skinType === "oily" ? "matte" : "natural";
  const colorCorrectingPrimer = isLow(profile.skinConditions?.redness);
  const neutralBias = profile.undertone === "warm" ? "peach-gold" : profile.undertone === "cool" ? "rose-mauve" : "outfit-driven";

  return { lipBlushFamily, baseFinish, colorCorrectingPrimer, neutralBias };
}

const PREGNANCY_SUPPRESSED_INGREDIENTS = ["retinoid", "retinol", "hydroquinone", "high-dose salicylic acid", "salicylic acid"];
const SENSITIVITY_SUPPRESSED_INGREDIENTS = ["aha", "bha", "glycolic acid", "salicylic acid", "retinoid", "retinol"];

/** SPEC.md.md §9 - runs as a suppression pass over already-generated recs, not baked into the rules above. */
export function applySafetySuppression(products: Product[], flags: SafetyFlags | undefined): Product[] {
  if (!flags) return products;

  const suppressed = new Set<string>();
  if (flags.pregnant || flags.breastfeeding) {
    PREGNANCY_SUPPRESSED_INGREDIENTS.forEach((i) => suppressed.add(i));
  }
  if (flags.sensitivities.length > 0 || flags.activeTreatment) {
    SENSITIVITY_SUPPRESSED_INGREDIENTS.forEach((i) => suppressed.add(i));
  }
  if (suppressed.size === 0) return products;

  return products.filter((p) => !(p.key_ingredients ?? []).some((ing) => suppressed.has(ing.toLowerCase())));
}
