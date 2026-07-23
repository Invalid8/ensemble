// Catalog ingestion (SPEC §12, DEVELOPMENT §6.1) — one-time snapshot, the app never calls RapidAPI live.
//
//   node scripts/ingest-catalog.mjs discover   → search both APIs, write scripts/probes/candidates.json
//   (curate: copy chosen ids into scripts/catalog-picks.json, add manual enrichment fields)
//   node scripts/ingest-catalog.mjs ingest     → fetch detail per pick, normalize, write src/data/catalog.json
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
  if (!existsSync(picksFile)) throw new Error(`Missing ${picksFile} — run discover, then curate picks into it.`);
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
      brand: cand.brand,
      name: cand.name,
      category: "beauty",
      subcategory: pick.subcategory || cand.subcategory,
      colors: pick.primary_color_hex ? [{ name: cur.variationValue || "", hex: pick.primary_color_hex }] : [],
      primary_color_hex: pick.primary_color_hex || "",
      shade: cur.variationType === "Color" ? [cur.variationValue, cur.variationDesc].filter(Boolean).join(" — ") || undefined : undefined,
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
    products.push({
      id: `asos-${pick.id}`,
      type: "apparel",
      brand: cand.brand,
      name: cand.name,
      category: "apparel",
      subcategory: pick.subcategory || cand.subcategory,
      colors: [{ name: cand.colour || "", hex: pick.primary_color_hex || "" }],
      primary_color_hex: pick.primary_color_hex || "",
      sizes: [...new Set((d.variants || []).filter((v) => v.isAvailable).map((v) => v.brandSize))],
      material,
      fit: pick.fit || d.fitType || fitMatch,
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

const mode = process.argv[2];
if (mode === "discover") await discover();
else if (mode === "ingest") await ingest();
else console.log("Usage: node scripts/ingest-catalog.mjs [discover|ingest]");
