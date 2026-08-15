import type { CompleteLook, LookProfile, LookReason, Product, Wardrobe } from "@/lib/types";
import { pickBestMatch } from "@/lib/composer/colorMatch";
import { generateRationale } from "@/lib/composer/rationale";
import {
  applySafetySuppression,
  getMakeupSpec,
  getNearFaceColorConstraints,
  getSkincareTags,
  type SkincareTag,
} from "@/lib/composer/rules";

// Catalog garments carry category:"apparel" with the garment type in `subcategory` (SPEC §12).
const NEAR_FACE_SUBCATEGORIES = new Set(["top", "dress", "blouse"]);
const LOWER_BODY_SUBCATEGORIES = new Set(["bottom", "pants", "skirt", "trousers", "shorts"]);
const LAYER_OCCASIONS = new Set(["interview", "office"]);

// §6.2 tags → the catalog's skincare subcategories (one product per matched subcategory).
const TAG_TO_SUBCATEGORY: Record<SkincareTag, string> = {
  "hydrating-serum": "skincare-hydrating",
  "rich-moisturizer": "skincare-hydrating",
  occlusive: "skincare-hydrating",
  "lightweight-gel": "skincare-oil-control",
  "oil-control": "skincare-oil-control",
  soothing: "skincare-soothing",
  brightening: "skincare-brightening",
  spf: "skincare-spf",
};

function colorName(product: Product, hex: string): string {
  return product.colors.find((c) => c.hex === hex)?.name ?? product.name;
}

function preferOccasion(products: Product[], occasion: string | undefined): Product[] {
  if (!occasion) return products;
  const tagged = products.filter((p) => p.occasion_tags.includes(occasion));
  return tagged.length > 0 ? tagged : products;
}

// §12 budget filter: price-band terciles per product type, relaxed rather than
// returning an incomplete look (band preference, not a hard cut).
function preferBudget(products: Product[], allOfType: Product[], budget: LookProfile["budget"]): Product[] {
  if (!budget || allOfType.length < 3) return products;
  const prices = allOfType.map((p) => p.price).sort((a, b) => a - b);
  const lo = prices[Math.floor(prices.length / 3)];
  const hi = prices[Math.floor((2 * prices.length) / 3)];
  const inBand = products.filter((p) =>
    budget === "value" ? p.price <= lo : budget === "premium" ? p.price >= hi : p.price > lo && p.price < hi
  );
  return inBand.length > 0 ? inBand : products;
}

// §6.3 lip/blush temperature, read from the retailer's own shade description
// ("Cool Teddy - cool deep tone beige", "Paramount - reddish brown").
function shadeTemperature(p: Product): "warm" | "cool" | "neutral" {
  const text = `${p.shade ?? ""} ${p.name}`.toLowerCase();
  if (/\bcool\b|berry|mauve|plum|lavender/.test(text)) return "cool";
  if (/\bwarm\b|brick|terracotta|peach|coral|watermelon|rust|brown/.test(text)) return "warm";
  return "neutral";
}

function pickByTemperature(
  items: Product[],
  family: "cool-berry-rose" | "warm-terracotta-brick" | "flex-to-undertone",
  undertone: LookProfile["undertone"],
  nearFaceColorHex: string
): Product | undefined {
  const target =
    family === "cool-berry-rose" ? "cool"
    : family === "warm-terracotta-brick" ? "warm"
    : undertone === "warm" ? "warm"
    : undertone === "cool" ? "cool"
    : "neutral";
  const matching = items.filter((p) => shadeTemperature(p) === target);
  const pool = matching.length > 0 ? matching : items;
  return pickBestMatch(pool, [nearFaceColorHex]);
}

/**
 * Runs the Look Composer end to end (SPEC.md.md §6): near-face color rule, skincare prep,
 * coordinated makeup, then the unified rationale. `catalog` is normalized to the §12 Product
 * schema regardless of which RapidAPI source eventually fills it (DEVELOPMENT.md §5.4).
 */
function matchesWardrobe(p: Product, wardrobe?: Wardrobe): boolean {
  if (!wardrobe) return true;
  return !p.gender || p.gender === "unisex" || p.gender === wardrobe;
}

export function composeLook(profile: LookProfile, catalog: Product[]): CompleteLook {
  const basePalette = (profile.palette ?? []).filter((hex) => !(profile.avoidColors ?? []).includes(hex));
  const allApparel = catalog.filter((p) => p.type === "apparel");
  const forWardrobe = allApparel.filter((p) => matchesWardrobe(p, profile.wardrobe));
  // Fall back to the full pool if the chosen wardrobe has no stock yet, so a look is never empty.
  const apparel = forWardrobe.length ? forWardrobe : allApparel;
  // §9 runs over the candidate pool, not the final picks - a suppressed product is
  // naturally replaced by the next-best safe candidate instead of leaving a gap.
  const beauty = applySafetySuppression(catalog.filter((p) => p.type === "beauty"), profile.safetyFlags);

  const nearFaceConstraints = getNearFaceColorConstraints(profile);
  const nearFaceCandidates = preferBudget(
    preferOccasion(apparel.filter((p) => NEAR_FACE_SUBCATEGORIES.has(p.subcategory.toLowerCase())), profile.occasion),
    apparel,
    profile.budget
  );
  const nearFaceGarment = pickBestMatch(nearFaceCandidates, nearFaceConstraints.allowedPalette);

  // A dress is the whole outfit; separates get a lower-body piece from the looser palette-only filter (§6.1).
  const isDress = nearFaceGarment?.subcategory.toLowerCase() === "dress";
  const lowerBodyCandidates = preferOccasion(
    apparel.filter((p) => LOWER_BODY_SUBCATEGORIES.has(p.subcategory.toLowerCase())),
    profile.occasion
  );
  const lowerBodyGarment = isDress ? undefined : pickBestMatch(lowerBodyCandidates, basePalette);

  // Tailored occasions add a layering piece, also filtered by the near-face rule (it frames the face too).
  const layerGarment =
    profile.occasion && LAYER_OCCASIONS.has(profile.occasion)
      ? pickBestMatch(
          preferOccasion(apparel.filter((p) => p.subcategory.toLowerCase() === "blazer"), profile.occasion),
          nearFaceConstraints.allowedPalette
        )
      : undefined;

  const garments = [nearFaceGarment, lowerBodyGarment, layerGarment].filter((g): g is Product => g !== undefined);

  const nearFaceColorHex = nearFaceGarment?.primary_color_hex ?? nearFaceConstraints.allowedPalette[0] ?? basePalette[0] ?? "#000000";

  const skincareTags = getSkincareTags(profile);
  const skincarePrep: Product[] = [];
  for (const tag of skincareTags) {
    const subcategory = TAG_TO_SUBCATEGORY[tag];
    if (skincarePrep.some((p) => p.subcategory === subcategory)) continue;
    const candidate = beauty.find((p) => p.subcategory === subcategory);
    if (candidate) skincarePrep.push(candidate);
  }

  const makeupSpec = getMakeupSpec(profile, nearFaceColorHex);
  // The catalog's colour cosmetics are all women's SKUs, so a menswear look finishes on
  // skincare alone rather than recommending a lip and blush nobody asked for. The skin read
  // still drives that half through the prep above, so the fusion holds either way.
  const wearsColorCosmetics = profile.wardrobe !== "men";
  const foundations = beauty.filter((p) => p.subcategory === "foundation");
  const finishKey = makeupSpec.baseFinish === "dewy-hydrating" ? "dewy" : makeupSpec.baseFinish;
  const foundation = foundations.find((p) => p.finish === finishKey) ?? foundations[0];
  const lipstick = wearsColorCosmetics
    ? pickByTemperature(beauty.filter((p) => p.subcategory === "lipstick"), makeupSpec.lipBlushFamily, profile.undertone, nearFaceColorHex)
    : undefined;
  const blush = wearsColorCosmetics
    ? pickByTemperature(beauty.filter((p) => p.subcategory === "blush"), makeupSpec.lipBlushFamily, profile.undertone, nearFaceColorHex)
    : undefined;
  const makeup = (wearsColorCosmetics ? [foundation, lipstick, blush] : []).filter(
    (p): p is Product => p !== undefined
  );

  const nearFaceColorName = nearFaceGarment ? colorName(nearFaceGarment, nearFaceColorHex) : nearFaceColorHex;
  const garmentName = nearFaceGarment?.name ?? "piece";

  const rationale = generateRationale({
    profile,
    nearFaceColorName,
    garmentName,
    garmentNoun: nearFaceGarment?.subcategory,
    makeupSpec,
    includeColorCosmetics: wearsColorCosmetics,
  });

  // §6.4b "Why This Look?" - every claim traces to a rule that actually fired above.
  // Empowering wording per §11.1; capped at 5.
  const reasons: LookReason[] = [];
  const noun = nearFaceGarment?.subcategory ?? "piece";
  if (profile.undertone) {
    reasons.push({ claim: `Matches your ${profile.undertone} undertone`, source: "undertone" });
  }
  const conditions = profile.skinConditions;
  if (conditions && conditions.redness.ui < 50) {
    reasons.push({ claim: `A calming ${noun} colour near the face, where warm reds would compete`, source: "skinCondition" });
  }
  if (conditions && conditions.radiance.ui < 50) {
    reasons.push({ claim: "Clear, bright colours chosen to lift radiance near the face", source: "skinCondition" });
  }
  if (wearsColorCosmetics && makeupSpec.baseFinish !== "natural") {
    reasons.push({
      claim: `A ${makeupSpec.baseFinish === "dewy-hydrating" ? "dewy, hydrating" : "matte"} base finish chosen for your skin today`,
      source: "skinCondition",
    });
  }
  // A menswear look has no base-finish claim, so without this the checklist would barely
  // mention the skin read - and the deletion test has to stay legible on every path (§1).
  if (!wearsColorCosmetics && skincarePrep.length > 0 && conditions) {
    reasons.push({ claim: "Skin prep chosen from your scan, not a generic routine", source: "skinCondition" });
  }
  if (profile.occasion) {
    reasons.push({ claim: `Styled for ${profile.occasion}`, source: "occasion" });
  }
  if (skincareTags.includes("occlusive")) {
    reasons.push({ claim: "Richer skincare prep for the harmattan air", source: "climate" });
  }
  if (profile.safetyFlags && (profile.safetyFlags.pregnant || profile.safetyFlags.breastfeeding || profile.safetyFlags.sensitivities.length > 0 || profile.safetyFlags.activeTreatment)) {
    reasons.push({ claim: "Skincare picks filtered around what you told us to be careful with", source: "safety" });
  }

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
    reasons: reasons.slice(0, 5),
  };
}

export * from "@/lib/composer/palette";
export * from "@/lib/composer/rules";
export * from "@/lib/composer/rationale";
export * from "@/lib/composer/colorMatch";
export * from "@/lib/composer/undertone";
