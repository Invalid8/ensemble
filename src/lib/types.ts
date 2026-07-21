export type Undertone = "warm" | "cool" | "neutral";
export type ColorSeason = "Spring" | "Summer" | "Autumn" | "Winter";
export type SkinType = "oily" | "dry" | "combo" | "sensitive";
export type BodyShape = "hourglass" | "pear" | "apple" | "rectangle" | "invTriangle";
export type FitPreference = "fitted" | "regular" | "relaxed";

export interface SkinConditionScore {
  ui: number;
  raw: number;
}

// `spots` maps from the API's `age_spot` skin-analysis concern, and `texture` from a concern
// that's actually nested by subregion (whole face/T-zone/U-zone) in the raw response - both need
// mapping at ingestion, not a 1:1 passthrough (DEVELOPMENT.md §6 item 3).
export interface SkinConditions {
  redness: SkinConditionScore;
  oiliness: SkinConditionScore;
  moisture: SkinConditionScore;
  radiance: SkinConditionScore;
  spots: SkinConditionScore;
  texture: SkinConditionScore;
}

export interface SafetyFlags {
  pregnant: boolean;
  breastfeeding: boolean;
  sensitivities: string[];
  activeTreatment: boolean;
  allergies: string[];
}

/**
 * The one shared object threaded through the app (SPEC.md.md §4).
 * Populated incrementally across the capture flow, read by the Composer at the end.
 */
export interface LookProfile {
  // from face scan (Skin AI) - undefined until that step completes.
  // `undertone` is DERIVED from skin-tone-analysis's `skin_color` hex via
  // src/lib/composer/undertone.ts, not read directly off the API response - it doesn't
  // return undertone or Fitzpatrick at all (DEVELOPMENT.md §6 item 2). `fitzpatrick` is kept
  // optional for if a real value ever becomes available; nothing currently populates it.
  undertone?: Undertone;
  tone?: string;
  fitzpatrick?: number;
  colorSeason?: ColorSeason;
  palette?: string[];
  avoidColors?: string[];
  skinConditions?: SkinConditions;
  skinFocusAreas?: string[];

  // from questionnaire
  skinType?: SkinType;
  skinGoals?: string[];
  safetyFlags?: SafetyFlags;
  bodyShape?: BodyShape;
  size?: string;
  fitPref?: FitPreference;
  occasion?: string;

  // derived
  country?: string;
  climateSeason?: string;
}

export interface Product {
  id: string;
  type: "apparel" | "beauty";
  brand: string;
  name: string;
  category: string;
  subcategory: string;
  colors: { name: string; hex: string }[];
  primary_color_hex: string;
  sizes?: string[];
  material?: string;
  fit?: string;
  shade?: string;
  finish?: string;
  key_ingredients?: string[];
  price: number;
  currency: string;
  image_url: string;
  product_url: string;
  occasion_tags: string[];
}

export interface CompleteLook {
  occasion: string;
  outfit: {
    garments: Product[];
    paletteUsed: string[];
    nearFaceColor: string;
  };
  beauty: {
    skincarePrep: Product[];
    makeup: Product[];
  };
  rationale: string;
}
