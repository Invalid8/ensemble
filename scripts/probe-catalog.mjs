// One-shot probe of the RapidAPI catalog sources (Sephora + ASOS).
// Saves raw responses to scripts/probes/*.json so the real ingestion script
// (see docs/DEVELOPMENT.md §6.1) can be written against confirmed shapes.
//
// Usage: node scripts/probe-catalog.mjs [sephora|asos]
// Spends ~3 requests per API — free-tier friendly, run once.

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const env = Object.fromEntries(
  readFileSync(path.join(root, "..", ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const outDir = path.join(root, "probes");
mkdirSync(outDir, { recursive: true });

async function probe(name, host, key, requests) {
  for (const { label, path: reqPath } of requests) {
    const url = `https://${host}${reqPath}`;
    const res = await fetch(url, {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": host },
    });
    const text = await res.text();
    const file = path.join(outDir, `${name}-${label}.json`);
    writeFileSync(file, text);
    console.log(`${res.ok ? "OK " : "ERR"} ${res.status} ${name}/${label} → ${file} (${text.length} bytes)`);
    await new Promise((r) => setTimeout(r, 1200)); // stay well under rate limits
  }
}

const only = process.argv[2];

if (!only || only === "sephora") {
  await probe("sephora", "sephora.p.rapidapi.com", env.SEPHORA_API_KEY || env.RAPIDAPI_KEY, [
    { label: "categories", path: "/categories/v2/list-root" },
    { label: "search-lipstick", path: "/us/products/v2/search?q=lipstick&pageSize=3&currentPage=1" },
    // productId placeholder — replace with a real id from the search result, then rerun: node scripts/probe-catalog.mjs sephora-detail
  ]);
}

if (!only || only === "asos") {
  await probe("asos", "asos10.p.rapidapi.com", env.ASOS_API_KEY || env.RAPIDAPI_KEY, [
    { label: "categories", path: "/api/v1/getCategories?country=US&languageShort=en" },
    { label: "search-dress", path: "/api/v1/getProductListBySearchTerm?searchTerm=dress&currency=USD&country=US&store=US&languageShort=en&sizeSchema=US&limit=3&offset=0&sort=recommended" },
  ]);
}

if (only === "sephora-detail") {
  const [id, sku] = process.argv.slice(3);
  if (!id) throw new Error("Usage: node scripts/probe-catalog.mjs sephora-detail <productId> [skuId]");
  await probe("sephora", "sephora.p.rapidapi.com", env.SEPHORA_API_KEY || env.RAPIDAPI_KEY, [
    { label: `detail-${id}`, path: `/us/products/v2/detail?productId=${id}${sku ? `&preferedSku=${sku}` : ""}` },
  ]);
}

if (only === "asos-detail") {
  const id = process.argv[3];
  if (!id) throw new Error("Usage: node scripts/probe-catalog.mjs asos-detail <productId>");
  await probe("asos", "asos10.p.rapidapi.com", env.ASOS_API_KEY || env.RAPIDAPI_KEY, [
    { label: `detail-${id}`, path: `/api/v1/getProductDetails?productId=${id}&currency=USD&country=US&store=US&languageShort=en&sizeSchema=US` },
  ]);
}
