// Push public/catalog/*.jpg to Cloudinary so the try-on fetches garments from a CDN that answers
// datacenter IPs. Signed uploads, no SDK. Re-run after fetch-catalog-images.mjs; already-uploaded
// ids overwrite in place, so it is safe to run again.
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";

const env = Object.fromEntries(
  (await readFile(".env.local", "utf8"))
    .split("\n")
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const CLOUD = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const KEY = env.CLOUDINARY_API_KEY;
const SECRET = env.CLOUDINARY_API_SECRET;
if (!CLOUD || !KEY || !SECRET) {
  console.error("missing Cloudinary credentials in .env.local");
  process.exit(1);
}

const FOLDER = "ensemble/catalog";
const DIR = new URL("../public/catalog/", import.meta.url);

function sign(params) {
  const canonical = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(canonical + SECRET).digest("hex");
}

const files = (await readdir(DIR)).filter((f) => f.endsWith(".jpg"));
let done = 0;
let failed = 0;

for (const file of files) {
  const id = file.replace(/\.jpg$/, "");
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { overwrite: "true", public_id: id, folder: FOLDER, timestamp: String(timestamp) };

  const form = new FormData();
  form.append("file", new Blob([await readFile(new URL(file, DIR))], { type: "image/jpeg" }), file);
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append("api_key", KEY);
  form.append("signature", sign(params));

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(60000),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message ?? `http ${res.status}`);
    done++;
    if (done % 20 === 0) console.log(`${done}/${files.length}`);
  } catch (err) {
    failed++;
    console.warn(`failed ${id}: ${err.message}`);
  }
}

console.log(`uploaded ${done}, failed ${failed}`);
console.log(`set NEXT_PUBLIC_CATALOG_CDN=https://res.cloudinary.com/${CLOUD}/image/upload/${FOLDER}`);
