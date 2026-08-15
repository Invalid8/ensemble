// Bake catalog garment photos into public/catalog so nothing fetches a retailer CDN at runtime.
// ASOS answers 403 to datacenter IPs, so a render on Vercel could never fetch its own reference
// image ("step":"ref image fetch","upstreamStatus":403) even though it works from a laptop.
// Run from a normal connection; re-run when the catalog changes.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const CATALOG = new URL("../src/data/catalog.json", import.meta.url);
const OUT = new URL("../public/catalog/", import.meta.url);
const WIDTH = 900; // enough detail for a try-on reference, small enough to ship

const catalog = JSON.parse(await readFile(CATALOG, "utf8"));
await mkdir(OUT, { recursive: true });

let saved = 0;
let skipped = 0;

for (const product of catalog) {
  const source = product.source_image_url ?? product.image_url;
  if (!source?.startsWith("http")) {
    skipped++;
    continue;
  }

  let bytes;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(source, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`http ${res.status}`);
      bytes = Buffer.from(await res.arrayBuffer());
      break;
    } catch (err) {
      if (attempt === 2) console.warn(`skip ${product.id}: ${err.message}`);
      else await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
    }
  }
  if (!bytes) {
    skipped++;
    continue;
  }

  // JPEG, not webp - the bytes go on to YouCam as a reference image.
  const out = await sharp(bytes).resize(WIDTH, null, { withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
  await writeFile(new URL(`${product.id}.jpg`, OUT), out);

  product.source_image_url = source;
  product.image_url = `/catalog/${product.id}.jpg`;
  saved++;
}

await writeFile(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`saved ${saved}, skipped ${skipped}`);
