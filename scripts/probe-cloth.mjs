// Error-driven discovery of the YouCam Apparel VTO ("cloth") task contract.
// Uploads a person image + a garment image, then tries candidate task-param shapes,
// printing each raw response so the API's own validation errors reveal the real fields.
// Reads YOUCAM_API_KEY from .env.local. Usage: node scripts/probe-cloth.mjs [person.jpg]
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);
const KEY = env.YOUCAM_API_KEY;
if (!KEY) {
  console.error("YOUCAM_API_KEY not found in .env.local");
  process.exit(1);
}
const BASE = "https://yce-api-01.makeupar.com";
const auth = { Authorization: `Bearer ${KEY}` };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const trim = (s) => (s.length > 900 ? s.slice(0, 900) + "…" : s);

async function rfetch(url, init, label) {
  for (let i = 0; i < 6; i++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(30000) });
    } catch (e) {
      console.log(`  (${label} ${i} transient: ${e?.cause?.code ?? e?.message})`);
      await sleep(900 * (i + 1));
    }
  }
  throw new Error(`${label} failed after retries`);
}

async function fetchBytes(url, label) {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      const buf = Buffer.from(await res.arrayBuffer());
      console.log(`${label}: ${buf.length} bytes (${res.headers.get("content-type")}) <- ${url.slice(0, 60)}`);
      return buf;
    } catch (e) {
      console.log(`  (${label} fetch ${i} transient: ${e?.cause?.code ?? e?.message})`);
      await sleep(800 * (i + 1));
    }
  }
  throw new Error(`could not fetch ${label}`);
}

async function uploadOne(feature, buf, name) {
  const fileRes = await rfetch(`${BASE}/s2s/v2.0/file/${feature}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ files: [{ content_type: "image/jpeg", file_name: name, file_size: buf.length }] }),
  }, "filepost");
  const fileText = await fileRes.text();
  if (!fileRes.ok) {
    console.log(`  upload ${name}: HTTP ${fileRes.status}\n  ${trim(fileText)}`);
    return null;
  }
  const f = JSON.parse(fileText).data.files[0];
  const put = await rfetch(f.requests[0].url, {
    method: f.requests[0].method,
    headers: { "Content-Type": "image/jpeg" },
    body: buf,
  }, "put");
  console.log(`  upload ${name}: file_id=${f.file_id ? "ok" : "MISSING"} put=${put.status}`);
  return f.file_id;
}

async function tryTask(feature, label, payload) {
  const res = await rfetch(`${BASE}/s2s/v2.0/task/${feature}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, "taskpost");
  const text = await res.text();
  console.log(`\n[task ${label}] HTTP ${res.status}\n  payload=${JSON.stringify(payload)}\n  ${trim(text)}`);
  if (!res.ok) return null;
  const taskId = JSON.parse(text).data?.task_id;
  if (!taskId) return null;
  for (let i = 0; i < 40; i++) {
    await sleep(2500);
    try {
      const p = await fetch(`${BASE}/s2s/v2.0/task/${feature}/${taskId}`, { headers: auth });
      const pj = JSON.parse(await p.text());
      const st = pj.data?.task_status;
      if (st === "success" || st === "error") {
        console.log(`  poll terminal="${st}"\n  FULL DATA: ${JSON.stringify(pj.data)}`);
        return pj.data;
      }
    } catch (e) {
      console.log(`  (poll ${i} transient: ${e?.cause?.code ?? e?.message})`);
    }
  }
  console.log("  poll timed out");
  return null;
}

const feature = process.argv[3] || "cloth";
const personUrl =
  process.argv[2] ||
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=900&fit=crop";
const garmentUrl = "https://images.asos-media.com/products/asos-design-wrapped-waist-mini-dress-in-red/211095668-1-red";

console.log(`feature="${feature}"`);
const personBuf = process.argv[2] ? readFileSync(process.argv[2]) : await fetchBytes(personUrl, "person");
const garmentBuf = await fetchBytes(garmentUrl, "garment");

console.log("\n--- uploads ---");
const personId = await uploadOne(feature, personBuf, "person.jpg");
const garmentId = await uploadOne(feature, garmentBuf, "garment.jpg");
if (!personId) process.exit(1);

// Confirmed: uploaded garment (ref_file_id) avoids error_download_image that external URLs hit.
const variants = [["id+fullbody", { src_file_id: personId, ref_file_id: garmentId, garment_category: "full_body" }]];

for (const [label, payload] of variants) {
  const data = await tryTask(feature, label, payload);
  if (data && data.task_status === "success" && data.results?.url) {
    const img = await fetchBytes(data.results.url, "RENDER");
    const out = process.argv[4] || "/tmp/vto-result.jpg";
    (await import("node:fs")).writeFileSync(out, img);
    console.log(`SAVED render -> ${out} (${img.length} bytes)`);
    break;
  }
}
