// Catalog ingestion (SPEC §12, DEVELOPMENT §6.1) - one-time snapshot, the app never calls RapidAPI live.
//
//   node scripts/ingest-catalog.mjs discover   → search both APIs, write scripts/probes/candidates.json
//   (curate: copy chosen ids into scripts/catalog-picks.json, add manual enrichment fields)
//   node scripts/ingest-catalog.mjs ingest     → fetch detail per pick, normalize, write src/data/catalog.json
//   node scripts/ingest-catalog.mjs mens        → search-only, auto-enrich, APPEND menswear to catalog.json
//                                                 (turnkey: no curation; ~8 API calls, dedupes by id)
//   node scripts/ingest-catalog.mjs mens-extra  → second menswear pass (suit jackets, linen, knitwear)
//   node scripts/ingest-catalog.mjs womens      → womenswear top-up, dress-heavy (~11 API calls)
//   node scripts/ingest-catalog.mjs clean       → repair pass on catalog.json: re-derive subcategory
//                                                 from the product name, rescue grey-fallback colours.
//                                                 No API calls, idempotent, safe to re-run any time.
//
// Enrichment that stays manual (per DEVELOPMENT §6.1): primary_color_hex, occasion_tags,
// apparel fit fallback, beauty finish fallback. Set them in catalog-picks.json.

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const probesDir = path.join(root, "probes");
mkdirSync(probesDir, { recursive: true });

const env = Object.fromEntries(
  readFileSync(path.join(root, "..", ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const SEPHORA = { host: "sephora.p.rapidapi.com", key: env.SEPHORA_API_KEY || env.RAPIDAPI_KEY };
const ASOS = { host: "asos10.p.rapidapi.com", key: env.ASOS_API_KEY || env.RAPIDAPI_KEY };

async function get(api, reqPath, cacheKey) {
  const cacheFile = cacheKey && path.join(probesDir, "detail-cache", `${cacheKey}.json`);
  if (cacheFile && existsSync(cacheFile)) return JSON.parse(readFileSync(cacheFile, "utf8"));
  const res = await fetch(`https://${api.host}${reqPath}`, {
    headers: { "x-rapidapi-key": api.key, "x-rapidapi-host": api.host },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${api.host}${reqPath} → ${text.slice(0, 200)}`);
  await new Promise((r) => setTimeout(r, 1300)); // free-tier politeness
  if (cacheFile) {
    mkdirSync(path.dirname(cacheFile), { recursive: true });
    writeFileSync(cacheFile, text);
  }
  return JSON.parse(text);
}

// ---------- discover ----------

const SEPHORA_SEARCHES = [
  { term: "foundation", subcategory: "foundation" },
  { term: "lipstick", subcategory: "lipstick" },
  { term: "blush", subcategory: "blush" },
  { term: "hydrating serum", subcategory: "skincare-hydrating" },
  { term: "gel moisturizer", subcategory: "skincare-oil-control" },
  { term: "vitamin c serum", subcategory: "skincare-brightening" },
  { term: "sunscreen face", subcategory: "skincare-spf" },
];

const ASOS_SEARCHES = [
  { term: "midi dress", subcategory: "dress" },
  { term: "blazer women", subcategory: "blazer" },
  { term: "satin top women", subcategory: "top" },
  { term: "blouse women", subcategory: "top" },
  { term: "wide leg trousers women", subcategory: "trousers" },
  { term: "pencil skirt", subcategory: "skirt" },
  { term: "wrap dress", subcategory: "dress" },
];

async function discover() {
  const candidates = { sephora: [], asos: [] };

  for (const { term, subcategory } of SEPHORA_SEARCHES) {
    const res = await get(SEPHORA, `/us/products/v2/search?q=${encodeURIComponent(term)}&pageSize=8&currentPage=1`);
    for (const p of res.products || []) {
      candidates.sephora.push({
        productId: p.productId,
        skuId: p.currentSku?.skuId,
        brand: p.brandName,
        name: p.displayName,
        listPrice: p.currentSku?.listPrice,
        rating: p.rating,
        moreColors: p.moreColors ?? 0,
        heroImage: p.heroImage,
        targetUrl: p.targetUrl,
        subcategory,
      });
    }
    console.log(`sephora "${term}": ${(res.products || []).length} candidates`);
  }

  for (const { term, subcategory } of ASOS_SEARCHES) {
    const res = await get(
      ASOS,
      `/api/v1/getProductListBySearchTerm?searchTerm=${encodeURIComponent(term)}&currency=USD&country=US&store=US&languageShort=en&sizeSchema=US&limit=10&offset=0&sort=recommended`
    );
    for (const p of res.data?.products || []) {
      candidates.asos.push({
        id: p.id,
        brand: p.brandName,
        name: p.name,
        colour: p.colour,
        price: p.price?.current?.value,
        currency: p.price?.currency || "USD",
        imageUrl: p.imageUrl,
        url: p.url,
        subcategory,
      });
    }
    console.log(`asos "${term}": ${(res.data?.products || []).length} candidates`);
  }

  const file = path.join(probesDir, "candidates.json");
  writeFileSync(file, JSON.stringify(candidates, null, 2));
  console.log(`\n${candidates.sephora.length} sephora + ${candidates.asos.length} asos candidates → ${file}`);
}

// ---------- ingest ----------

const KNOWN_ACTIVES = [
  ["niacinamide", "niacinamide"],
  ["hyaluron", "hyaluronic acid"],
  ["ascorb", "vitamin C"],
  ["retino", "retinoid"],
  ["salicylic", "salicylic acid"],
  ["glycolic", "glycolic acid"],
  ["lactic acid", "lactic acid"],
  ["azelaic", "azelaic acid"],
  ["centella", "centella"],
  ["madecassoside", "centella"],
  ["ceramide", "ceramides"],
  ["panthenol", "panthenol"],
  ["squalane", "squalane"],
  ["glycerin", "glycerin"],
  ["zinc oxide", "zinc oxide (SPF)"],
  ["titanium dioxide", "titanium dioxide"],
  ["avobenzone", "avobenzone (SPF)"],
  ["hydroquinone", "hydroquinone"],
  ["kojic", "kojic acid"],
];

function extractActives(ingredientDesc = "") {
  const lower = ingredientDesc.toLowerCase();
  const found = [];
  for (const [needle, label] of KNOWN_ACTIVES) if (lower.includes(needle) && !found.includes(label)) found.push(label);
  return found;
}

function detectFinish(text = "") {
  const t = text.toLowerCase();
  if (t.includes("matte")) return "matte";
  if (t.includes("dewy") || t.includes("radiant") || t.includes("glow") || t.includes("luminous")) return "dewy";
  if (t.includes("satin")) return "satin";
  if (t.includes("natural")) return "natural";
  return undefined;
}

function parsePrice(listPrice = "") {
  const m = String(listPrice).match(/\$([\d.]+)/); // first price of a "$16.00 - $25.00" range
  return m ? Number(m[1]) : 0;
}

async function ingest() {
  const picksFile = path.join(root, "catalog-picks.json");
  if (!existsSync(picksFile)) throw new Error(`Missing ${picksFile} - run discover, then curate picks into it.`);
  const picks = JSON.parse(readFileSync(picksFile, "utf8"));
  const candidates = JSON.parse(readFileSync(path.join(probesDir, "candidates.json"), "utf8"));

  const products = [];

  for (const pick of picks.sephora || []) {
    const cand = candidates.sephora.find((c) => c.productId === pick.productId);
    if (!cand) { console.warn(`skip sephora ${pick.productId}: not in candidates`); continue; }
    const sku = pick.skuId || cand.skuId;
    const d = await get(SEPHORA, `/us/products/v2/detail?productId=${pick.productId}&preferedSku=${sku}`, `seph-${pick.productId}-${sku}`);
    const cur = d.currentSku || {};
    products.push({
      id: `seph-${pick.productId}`,
      type: "beauty",
      gender: "unisex",
      brand: cand.brand,
      name: cand.name,
      category: "beauty",
      subcategory: pick.subcategory || cand.subcategory,
      colors: pick.primary_color_hex ? [{ name: cur.variationValue || "", hex: pick.primary_color_hex }] : [],
      primary_color_hex: pick.primary_color_hex || "",
      shade: cur.variationType === "Color" ? [cur.variationValue, cur.variationDesc].filter(Boolean).join(" - ") || undefined : undefined,
      finish: pick.finish || detectFinish(`${cand.name} ${(cur.highlights || []).map((h) => h.name || h).join(" ")}`),
      key_ingredients: extractActives(cur.ingredientDesc),
      price: parsePrice(cur.listPrice || cand.listPrice),
      currency: "USD",
      image_url: cand.heroImage,
      product_url: `https://www.sephora.com${cand.targetUrl}`,
      occasion_tags: pick.occasion_tags || [],
    });
    console.log(`ok sephora ${pick.productId} ${cand.name}`);
  }

  for (const pick of picks.asos || []) {
    const cand = candidates.asos.find((c) => c.id === pick.id);
    if (!cand) { console.warn(`skip asos ${pick.id}: not in candidates`); continue; }
    const d = (await get(ASOS, `/api/v1/getProductDetails?productId=${pick.id}&currency=USD&country=US&store=US&languageShort=en&sizeSchema=US`, `asos-${pick.id}`)).data || {};
    const material = (d.info?.aboutMe || "").match(/Main:\s*([^.<]+)/)?.[1]?.trim();
    const fitMatch = (d.description || "").match(/(regular|relaxed|fitted|slim|oversized|tailored)\s+fit/i)?.[1]?.toLowerCase();
    // ASOS fitType is an object {id, name}, not a string
    const fitType = typeof d.fitType === "object" && d.fitType !== null ? d.fitType.name?.toLowerCase() : d.fitType;
    products.push({
      id: `asos-${pick.id}`,
      type: "apparel",
      gender: "women",
      brand: cand.brand,
      name: cand.name,
      category: "apparel",
      subcategory: pick.subcategory || cand.subcategory,
      colors: [{ name: cand.colour || "", hex: pick.primary_color_hex || "" }],
      primary_color_hex: pick.primary_color_hex || "",
      sizes: [...new Set((d.variants || []).filter((v) => v.isAvailable).map((v) => v.brandSize))],
      material,
      fit: pick.fit || fitType || fitMatch,
      price: cand.price,
      currency: cand.currency,
      image_url: `https://${cand.imageUrl}`,
      product_url: `https://www.asos.com/us/${cand.url}`,
      occasion_tags: pick.occasion_tags || [],
    });
    console.log(`ok asos ${pick.id} ${cand.name}`);
  }

  const outDir = path.join(root, "..", "src", "data");
  mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, "catalog.json");
  writeFileSync(out, JSON.stringify(products, null, 2));

  const missingHex = products.filter((p) => !p.primary_color_hex).length;
  const missingTags = products.filter((p) => !p.occasion_tags.length).length;
  console.log(`\n${products.length} products → ${out}`);
  if (missingHex) console.log(`⚠ ${missingHex} products missing primary_color_hex (manual enrichment, DEVELOPMENT §6.1)`);
  if (missingTags) console.log(`⚠ ${missingTags} products missing occasion_tags`);
}

// ---------- menswear (turnkey, additive) ----------

// The composer only understands these subcategories, so menswear maps onto them:
// shirts/polos/tees -> "top" (near-face), chinos/jeans/suit trousers -> "trousers", "blazer" (layer).
const ASOS_MENS_SEARCHES = [
  { term: "mens smart shirt", subcategory: "top", tags: ["interview", "office", "dinner", "wedding"] },
  { term: "mens oxford shirt", subcategory: "top", tags: ["office", "smart-casual", "dinner"] },
  { term: "mens polo shirt", subcategory: "top", tags: ["casual", "weekend", "smart-casual"] },
  { term: "mens t-shirt", subcategory: "top", tags: ["casual", "weekend"] },
  { term: "mens blazer", subcategory: "blazer", tags: ["interview", "office", "wedding", "dinner"] },
  { term: "mens chinos", subcategory: "trousers", tags: ["office", "smart-casual", "dinner", "casual"] },
  { term: "mens slim jeans", subcategory: "trousers", tags: ["casual", "weekend"] },
  { term: "mens suit trousers", subcategory: "trousers", tags: ["interview", "office", "wedding"] },
];

// Colour name -> representative hex, so apparel gets a palette match without manual enrichment.
// Retailers name colours poetically ("mole", "laurel wreath", "lemon pepper"), and every name
// that misses here collapses to neutral grey and matches every palette equally badly - so the
// vocabulary is deliberately wide.
const COLOR_HEX = {
  black: "#1a1a1a", white: "#f4f2ec", ivory: "#f0e9dc", cream: "#ece3d2", ecru: "#e0d6c2",
  oat: "#ddd0b8", biscuit: "#d8c4a4", grey: "#8a8a8a", gray: "#8a8a8a", silver: "#c0c0c0",
  slate: "#5a6672", charcoal: "#36393b", navy: "#1f2a44", indigo: "#2b3a67", cobalt: "#2b4fa2",
  blue: "#2f4b7c", denim: "#4a6785", aqua: "#6fb3bf", turquoise: "#3fa8a0", teal: "#2f6b6b",
  mint: "#9ec9a8", sage: "#9aa88c", swamp: "#5f6b4a", green: "#3f5e3f", forest: "#2c4432",
  bottle: "#26433a", emerald: "#046307", laurel: "#59684a", olive: "#5b5a2f", khaki: "#7c7048",
  beige: "#c8b79a", stone: "#b8ab95", sand: "#cbb894", taupe: "#9c8d7d", mole: "#7a6a5c",
  morel: "#8a7663", mink: "#a4907c", tan: "#b48a60", camel: "#a67b4f", caramel: "#a9713f",
  toffee: "#8a5a34", chocolate: "#4a3222", espresso: "#3a2a20", mocha: "#6b4f3a", brown: "#5a3f2b",
  rust: "#a4552c", terracotta: "#b2603f", copper: "#a5642e", bronze: "#8c6b32", gold: "#c2952f",
  mustard: "#b8862f", ochre: "#b57f2a", lemon: "#d6c65c", yellow: "#c9a94a", apricot: "#d9a06a",
  peach: "#e0a487", coral: "#d0705c", orange: "#c26b3a", scarlet: "#b32d28", crimson: "#96233a",
  cherry: "#a11d33", red: "#9b2d2d", wine: "#5e2230", maroon: "#5c2230", burgundy: "#5a1f2a",
  berry: "#7a2745", plum: "#5c2a4a", aubergine: "#432a3f", fig: "#5b3a4a", rose: "#c07f88",
  blush: "#dcb1ae", pink: "#c98a94", lilac: "#b7a4cc", lavender: "#a894c4", purple: "#4b3a5a",
  sapphire: "#0f52ba", raisin: "#4d2f33", tweed: "#8a7a63", buttermilk: "#efe3c4", parsnip: "#e6dbba",
};

const FALLBACK_HEX = "#5a5a5a";

function colorToHex(name = "") {
  const n = name.toLowerCase().trim();
  if (COLOR_HEX[n]) return COLOR_HEX[n];
  // Longest key first, so "burnt orange" does not match "tan" inside "orange".
  for (const key of Object.keys(COLOR_HEX).sort((a, b) => b.length - a.length)) {
    if (n.includes(key)) return COLOR_HEX[key];
  }
  return FALLBACK_HEX;
}

// The composer only understands dress / blazer / top / trousers / skirt. A search term is a
// poor classifier ("mens suit" returns suit trousers), so the product name decides.
const GARMENT_PATTERNS = [
  ["skirt", /\bskirts?\b/],
  ["dress", /\bdress(es)?\b/],
  ["blazer", /\b(blazers?|suit jackets?|tuxedo jackets?|sport coats?)\b/],
  ["trousers", /\b(pants|trousers|jeans|chinos|culottes|leggings|shorts|joggers)\b/],
  ["top", /\b(shirts?|blouses?|tops?|polos?|tees?|t-shirts?|overshirts?|shackets?|knits?|knitted|sweaters?|jumpers?|cardigans?|vests?|bodysuits?|camisoles?)\b/],
];

// "shirt dress" is a dress, not a shirt - compound nouns beat first-word-wins. A length
// modifier can sit in the middle of the compound ("shirt mini dress").
const DRESS_COMPOUND =
  /\b(shirt|slip|wrap|sweater|knit|jumper|polo|t-shirt|blazer|smock|sun|cami|corset|tea)\s*-?\s*(mini|midi|maxi|micro|column|skater|slip)?\s*-?\s*dress\b/;

function subcategoryFromName(name = "", fallback, brand = "") {
  // A brand can carry a garment word ("Tommy Jeans oxford shirt"), so drop it before matching.
  let n = name.toLowerCase();
  const b = brand.toLowerCase().trim();
  if (b && n.startsWith(b)) n = n.slice(b.length);

  if (DRESS_COMPOUND.test(n)) return "dress";

  // Sets name several garments ("blazer ... and maxi skirt set"); the one named first leads.
  let best = null;
  for (const [sub, pattern] of GARMENT_PATTERNS) {
    const at = n.search(pattern);
    if (at !== -1 && (best === null || at < best.at)) best = { sub, at };
  }
  return best?.sub ?? fallback;
}

// Womenswear top-up. The curated `ingest` pass covered the four season palettes thinly;
// this widens the wardrobe (dresses especially) so the composer has real choice per occasion.
const ASOS_WOMENS_SEARCHES = [
  { term: "womens midi dress", subcategory: "dress", tags: ["dinner", "date", "wedding-guest", "evening"] },
  { term: "womens maxi dress", subcategory: "dress", tags: ["wedding-guest", "evening", "vacation"] },
  { term: "womens cocktail dress", subcategory: "dress", tags: ["evening", "date", "dinner"] },
  { term: "womens shirt dress", subcategory: "dress", tags: ["office", "everyday", "smart-casual"] },
  { term: "womens slip dress", subcategory: "dress", tags: ["date", "evening", "dinner"] },
  { term: "womens wrap dress", subcategory: "dress", tags: ["office", "dinner", "wedding-guest"] },
  { term: "womens tailored blazer", subcategory: "blazer", tags: ["interview", "office", "dinner"] },
  { term: "womens silk blouse", subcategory: "top", tags: ["office", "dinner", "interview"] },
  { term: "womens knit top", subcategory: "top", tags: ["everyday", "smart-casual", "weekend"] },
  { term: "womens tailored trousers", subcategory: "trousers", tags: ["interview", "office", "dinner"] },
  { term: "womens midi skirt", subcategory: "skirt", tags: ["office", "dinner", "everyday"] },
];

// Menswear top-up alongside the original eight searches. Search for the jacket explicitly -
// "mens suit" mostly returns suit trousers, which the name classifier then files as trousers.
const ASOS_MENS_EXTRA_SEARCHES = [
  { term: "mens suit jacket", subcategory: "blazer", tags: ["interview", "wedding", "office"] },
  { term: "mens tailored blazer", subcategory: "blazer", tags: ["interview", "office", "dinner"] },
  { term: "mens linen shirt", subcategory: "top", tags: ["vacation", "smart-casual", "weekend"] },
  { term: "mens overshirt", subcategory: "top", tags: ["smart-casual", "casual", "weekend"] },
  { term: "mens knitted polo", subcategory: "top", tags: ["dinner", "smart-casual", "date"] },
  { term: "mens tailored trousers", subcategory: "trousers", tags: ["interview", "office", "wedding"] },
];

/**
 * Turnkey, additive wardrobe fill: search-only (no detail calls), auto-enriched from the
 * colour name, deduped by id, appended to the existing catalog. Safe to re-run.
 */
async function ingestWardrobe(searches, gender, perTerm = 3) {
  const outPath = path.join(root, "..", "src", "data", "catalog.json");
  const existing = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : [];
  const byId = new Map(existing.map((p) => [p.id, p]));
  let added = 0;

  for (const { term, subcategory, tags } of searches) {
    const res = await get(
      ASOS,
      `/api/v1/getProductListBySearchTerm?searchTerm=${encodeURIComponent(term)}&currency=USD&country=US&store=US&languageShort=en&sizeSchema=US&limit=12&offset=0&sort=recommended`
    );
    const products = (res.data?.products || []).filter((p) => p.imageUrl && p.price?.current?.value);
    let taken = 0;
    for (const p of products) {
      if (taken >= perTerm) break;
      const id = `asos-${p.id}`;
      if (byId.has(id)) continue;
      // Fall back to the product name when the colour field is a poetic one-off.
      const hex = colorToHex(p.colour) === FALLBACK_HEX ? colorToHex(p.name) : colorToHex(p.colour);
      byId.set(id, {
        id,
        type: "apparel",
        gender,
        brand: p.brandName,
        name: p.name,
        category: "apparel",
        subcategory: subcategoryFromName(p.name, subcategory, p.brandName),
        colors: [{ name: p.colour || "", hex }],
        primary_color_hex: hex,
        price: p.price.current.value,
        currency: p.price.currency || "USD",
        image_url: `https://${p.imageUrl}`,
        product_url: `https://www.asos.com/us/${p.url}`,
        occasion_tags: tags,
      });
      taken++;
      added++;
      console.log(`+ ${gender} ${subcategory}: ${p.name} (${p.colour || "?"} -> ${hex})`);
    }
    console.log(`asos "${term}": kept ${taken}`);
  }

  const merged = [...byId.values()];
  writeFileSync(outPath, JSON.stringify(merged, null, 2) + "\n");
  console.log(`\nadded ${added} ${gender} items; catalog now ${merged.length} products → ${outPath}`);
}

/**
 * Repair pass over the catalog already on disk: re-derive apparel subcategory from the product
 * name and rescue any colour that fell back to neutral grey. Idempotent, no API calls.
 */
function cleanCatalog() {
  const outPath = path.join(root, "..", "src", "data", "catalog.json");
  const products = JSON.parse(readFileSync(outPath, "utf8"));
  let recategorized = 0;
  let recolored = 0;

  for (const p of products) {
    if (p.category !== "apparel") continue;

    const sub = subcategoryFromName(p.name, p.subcategory, p.brand);
    if (sub !== p.subcategory) {
      console.log(`~ ${p.subcategory} -> ${sub}: ${p.name}`);
      p.subcategory = sub;
      recategorized++;
    }

    if (p.primary_color_hex === FALLBACK_HEX || !p.primary_color_hex) {
      const named = p.colors?.[0]?.name || "";
      const hex = colorToHex(named) === FALLBACK_HEX ? colorToHex(p.name) : colorToHex(named);
      if (hex !== FALLBACK_HEX) {
        console.log(`~ colour "${named || p.name}" -> ${hex}`);
        p.primary_color_hex = hex;
        if (p.colors?.[0]) p.colors[0].hex = hex;
        recolored++;
      }
    }
  }

  writeFileSync(outPath, JSON.stringify(products, null, 2) + "\n");
  const stillGrey = products.filter((p) => p.category === "apparel" && p.primary_color_hex === FALLBACK_HEX).length;
  console.log(`\n${recategorized} recategorized, ${recolored} recoloured, ${stillGrey} still unmatched → ${outPath}`);
}

const mode = process.argv[2];
if (mode === "clean") cleanCatalog();
else if (mode === "discover") await discover();
else if (mode === "ingest") await ingest();
else if (mode === "mens") await ingestWardrobe(ASOS_MENS_SEARCHES, "men");
else if (mode === "mens-extra") await ingestWardrobe(ASOS_MENS_EXTRA_SEARCHES, "men");
else if (mode === "womens") await ingestWardrobe(ASOS_WOMENS_SEARCHES, "women");
else console.log("Usage: node scripts/ingest-catalog.mjs [discover|ingest|mens|mens-extra|womens|clean]");
