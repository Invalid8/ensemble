import type { LookProfile } from "@/lib/types";
import type { MakeupSpec } from "@/lib/composer/rules";

const BASE_FINISH_PHRASE: Record<MakeupSpec["baseFinish"], string> = {
  "dewy-hydrating": "dewy",
  matte: "matte",
  natural: "natural",
};

const LIP_PHRASE: Record<MakeupSpec["lipBlushFamily"], string> = {
  "cool-berry-rose": "cool-rose",
  "warm-terracotta-brick": "terracotta",
  "flex-to-undertone": "soft neutral",
};

/**
 * SPEC.md.md §6.4 - the one narrative that makes the skin -> outfit -> beauty dependency
 * audible. Must move in one direction (skin fact -> color choice -> why -> beauty finish ->
 * occasion) per CONTENT.md §5 - never reorder or skip a link in the chain.
 */
// Catalog names carry retail cruft ("... in khaki - part of a set") that reads as clutter and
// duplicates the colour we already say. Strip the set suffix and a trailing "in <colour>".
function cleanGarmentName(name: string): string {
  return name
    .replace(/\s*-\s*part of a set\s*$/i, "")
    .replace(/\s+in\s+[a-z][a-z ]*$/i, "")
    .trim();
}

export function generateRationale(opts: {
  profile: LookProfile;
  nearFaceColorName: string;
  garmentName: string;
  /** Short garment noun ("dress", "top") for the second mention - the full name reads twice as clutter. */
  garmentNoun?: string;
  makeupSpec: MakeupSpec;
  /** False for a menswear look, which finishes on skincare instead of a lip and base. */
  includeColorCosmetics?: boolean;
}): string {
  const { profile, garmentName, makeupSpec } = opts;
  const garmentNoun = opts.garmentNoun ?? garmentName;
  const garment = cleanGarmentName(garmentName);
  // Retailers store colour names shouting ("BLUE", "ECRU"); the rationale is read aloud.
  const nearFaceColorName = opts.nearFaceColorName.toLowerCase();

  const undertone = profile.undertone ?? "neutral";
  const topConcern = profile.skinFocusAreas?.[0];
  const openingClause = topConcern
    ? `You're ${undertone}-toned with some ${topConcern}, so we chose`
    : `You're ${undertone}-toned, so we chose`;
  const calmsClause = topConcern ? "which flatters your colouring and calms it" : "which flatters your colouring";
  const skinType = profile.skinType ? `${profile.skinType} ` : "";
  const baseFinish = BASE_FINISH_PHRASE[makeupSpec.baseFinish];
  const lip = LIP_PHRASE[makeupSpec.lipBlushFamily];
  const occasion = profile.occasion ?? "today";

  const opening = `${openingClause} this ${nearFaceColorName} ${garment}, ${calmsClause}. `;

  // Same chain either way: skin fact -> colour choice -> why -> skin care -> occasion. Only
  // the beauty link changes, so a menswear look never promises a lip nobody picked.
  if (opts.includeColorCosmetics === false) {
    return (
      opening +
      `To finish: prep chosen for your ${skinType}skin so the colour sits clean against it - ` +
      `ready for ${occasion}.`
    );
  }

  return (
    opening +
    `To finish: a ${baseFinish} base for your ${skinType}skin, a ${lip} lip that ties to the ` +
    `${garmentNoun}, all shade-matched to you - ready for ${occasion}.`
  );
}
