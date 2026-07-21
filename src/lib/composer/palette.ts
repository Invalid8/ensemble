import type { ColorSeason, Undertone } from "@/lib/types";
import type { Depth } from "@/lib/composer/undertone";

// Exact palette values from SPEC.md.md §10 — simplified 4-season engine, not a professional session.
export const SEASON_PALETTES: Record<ColorSeason, string[]> = {
  Spring: ["#FF7F50", "#FFDAB9", "#9ACD32", "#FFC300", "#C19A6B"],
  Autumn: ["#B7410E", "#808000", "#E1AD01", "#E2725B", "#FFFDD0"],
  Summer: ["#A9C1D9", "#B57EDC", "#C08081", "#D8A7B1", "#708090"],
  Winter: ["#BF0A30", "#046307", "#002366", "#C154C1", "#000000"],
};

/**
 * Simplified color-season engine (SPEC.md.md §10): undertone x depth -> season.
 * "Neutral -> nudge to nearest" is left unspecified by the spec; this picks the season for the
 * matching depth, biased warm.
 *
 * `undertone` and `depth` come from `deriveUndertoneAndDepth` (src/lib/composer/undertone.ts) —
 * the confirmed skin-tone-analysis response has no `undertone` or `fitzpatrick` field at all
 * (DEVELOPMENT.md §6 item 2), only raw hex colors, so both are derived from `skin_color` there
 * rather than read directly off the API response.
 */
export function getColorSeason(undertone: Undertone, depth: Depth): ColorSeason {
  if (undertone === "warm") return depth === "light-medium" ? "Spring" : "Autumn";
  if (undertone === "cool") return depth === "light-medium" ? "Summer" : "Winter";

  return depth === "light-medium" ? "Spring" : "Autumn";
}

export function getPaletteForSeason(season: ColorSeason): string[] {
  return SEASON_PALETTES[season];
}

const SOUTHERN_HEMISPHERE_COUNTRIES = new Set([
  "australia",
  "new zealand",
  "south africa",
  "argentina",
  "chile",
  "brazil",
  "peru",
]);

/**
 * Climate season (SPEC.md.md §10): hemisphere from country + month, with a tropical
 * special-case for Nigeria (wet ~Apr-Oct, dry/harmattan ~Nov-Mar). Affects garment
 * type/weight + skincare, never color — keep separate from getColorSeason.
 */
export function getClimateSeason(country: string, date: Date = new Date()): string {
  const month = date.getMonth() + 1; // 1-12
  const normalizedCountry = country.trim().toLowerCase();

  if (normalizedCountry === "nigeria") {
    return month >= 4 && month <= 10 ? "wet" : "dry-harmattan";
  }

  const isSouthern = SOUTHERN_HEMISPHERE_COUNTRIES.has(normalizedCountry);

  // Standard meteorological seasons, Northern hemisphere; flipped for Southern.
  const northernSeason =
    month === 12 || month <= 2
      ? "winter"
      : month <= 5
        ? "spring"
        : month <= 8
          ? "summer"
          : "autumn";

  if (!isSouthern) return northernSeason;

  const flip: Record<string, string> = { winter: "summer", summer: "winter", spring: "autumn", autumn: "spring" };
  return flip[northernSeason];
}
