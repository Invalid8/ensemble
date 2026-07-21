import type { CompleteLook, LookProfile, Product } from "@/lib/types";
import { pickBestMatch } from "@/lib/composer/colorMatch";
import { generateRationale } from "@/lib/composer/rationale";
import {
  applySafetySuppression,
  getMakeupSpec,
  getNearFaceColorConstraints,
  getSkincareTags,
} from "@/lib/composer/rules";

const NEAR_FACE_CATEGORIES = new Set(["top", "dress", "blouse"]);
const LOWER_BODY_CATEGORIES = new Set(["bottom", "pants", "skirt", "trousers", "shorts"]);

function colorName(product: Product, hex: string): string {
  return product.colors.find((c) => c.hex === hex)?.name ?? product.name;
}

/**
 * Runs the Look Composer end to end (SPEC.md.md §6): near-face color rule, skincare prep,
 * coordinated makeup, then the unified rationale. `catalog` is normalized to the §12 Product
 * schema regardless of which RapidAPI source eventually fills it (DEVELOPMENT.md §5.4).
 */
export function composeLook(profile: LookProfile, catalog: Product[]): CompleteLook {
  const basePalette = (profile.palette ?? []).filter((hex) => !(profile.avoidColors ?? []).includes(hex));
  const apparel = catalog.filter((p) => p.type === "apparel");
  const beauty = catalog.filter((p) => p.type === "beauty");

  const nearFaceConstraints = getNearFaceColorConstraints(profile);
  const nearFaceCandidates = apparel.filter((p) => NEAR_FACE_CATEGORIES.has(p.category.toLowerCase()));
  const nearFaceGarment = pickBestMatch(nearFaceCandidates, nearFaceConstraints.allowedPalette);

  const lowerBodyCandidates = apparel.filter((p) => LOWER_BODY_CATEGORIES.has(p.category.toLowerCase()));
  const lowerBodyGarment = pickBestMatch(lowerBodyCandidates, basePalette);

  const garments = [nearFaceGarment, lowerBodyGarment].filter((g): g is Product => g !== undefined);

  const nearFaceColorHex = nearFaceGarment?.primary_color_hex ?? nearFaceConstraints.allowedPalette[0] ?? basePalette[0] ?? "#000000";

  const skincareTags = getSkincareTags(profile);
  const skincareCandidates = beauty.filter(
    (p) => p.subcategory.toLowerCase() === "skincare" && (p.key_ingredients ?? []).some((ing) => skincareTags.some((tag) => ing.toLowerCase().includes(tag.split("-")[0])))
  );
  const skincarePrep = applySafetySuppression(skincareCandidates, profile.safetyFlags);

  const makeupSpec = getMakeupSpec(profile, nearFaceColorHex);
  const makeupCandidates = beauty.filter((p) => p.subcategory.toLowerCase() === "makeup");
  const makeup = applySafetySuppression(makeupCandidates, profile.safetyFlags);

  const nearFaceColorName = nearFaceGarment ? colorName(nearFaceGarment, nearFaceColorHex) : nearFaceColorHex;
  const garmentName = nearFaceGarment?.name ?? "piece";

  const rationale = generateRationale({ profile, nearFaceColorName, garmentName, makeupSpec });

  return {
    occasion: profile.occasion ?? "",
    outfit: {
      garments,
      paletteUsed: basePalette,
      nearFaceColor: nearFaceColorHex,
    },
    beauty: {
      skincarePrep,
      makeup,
    },
    rationale,
  };
}

export * from "@/lib/composer/palette";
export * from "@/lib/composer/rules";
export * from "@/lib/composer/rationale";
export * from "@/lib/composer/colorMatch";
export * from "@/lib/composer/undertone";
