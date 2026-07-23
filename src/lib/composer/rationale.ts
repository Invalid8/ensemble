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
export function generateRationale(opts: {
  profile: LookProfile;
  nearFaceColorName: string;
  garmentName: string;
  /** Short garment noun ("dress", "top") for the second mention — the full name reads twice as clutter. */
  garmentNoun?: string;
  makeupSpec: MakeupSpec;
}): string {
  const { profile, nearFaceColorName, garmentName, makeupSpec } = opts;
  const garmentNoun = opts.garmentNoun ?? garmentName;

  const undertone = profile.undertone ?? "neutral";
  const topConcern = profile.skinFocusAreas?.[0];
  const openingClause = topConcern
    ? `You're ${undertone}-toned with some ${topConcern}, so we chose`
    : `You're ${undertone}-toned and your skin's looking balanced today, so we chose`;
  const calmsClause = topConcern ? "which flatters your colouring and calms it" : "which flatters your colouring";
  const skinState = profile.skinType ?? "your";
  const baseFinish = BASE_FINISH_PHRASE[makeupSpec.baseFinish];
  const lip = LIP_PHRASE[makeupSpec.lipBlushFamily];
  const occasion = profile.occasion ?? "today";

  return (
    `${openingClause} this ${nearFaceColorName} ${garmentName} - shown on you - ` +
    `${calmsClause}. To finish: a ${baseFinish} base for your ${skinState} skin, a ${lip} lip that ties to the ` +
    `${garmentNoun}, all shade-matched to you - ready for ${occasion}.`
  );
}
