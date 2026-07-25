// Probe whether chaining cloth VTO works: render a top on the person, then render trousers
// onto THAT result (using the first render as the new person src). Saves the final image.
// Usage: node scripts/probe-cloth-chain.mjs [person.jpg] [outfile]
import { readFileSync, writeFileSync } from "node:fs";

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
if (!KEY) { console.error("no YOUCAM_API_KEY"); process.exit(1); }
const BASE = "https://yce-api-01.makeupar.com";
const auth = { Authorization: `Bearer ${KEY}` };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rfetch(url, init, label) {
  for (let i = 0; i < 6; i++) {
    try { return await fetch(url, { ...init, signal: AbortSignal.timeout(30000) }); }
    catch (e) { console.log(`  (${label} ${i}: ${e?.cause?.code ?? e?.message})`); await sleep(900 * (i + 1)); }
  }
  throw new Error(`${label} failed`);
}
async function bytesOf(url, label) {
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
      const b = Buffer.from(await r.arrayBuffer());
      console.log(`${label}: ${b.length}b`);
      return b;
    } catch (e) { console.log(`  (${label} fetch ${i}: ${e?.cause?.code ?? e?.message})`); await sleep(800 * (i + 1)); }
  }
  throw new Error(`fetch ${label} failed`);
}
async function upload(buf, name) {
  const res = await rfetch(`${BASE}/s2s/v2.0/file/cloth`, {
    method: "POST", headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ files: [{ content_type: "image/jpeg", file_name: name, file_size: buf.length }] }),
  }, "filepost");
  const f = JSON.parse(await res.text()).data.files[0];
  await rfetch(f.requests[0].url, { method: f.requests[0].method, headers: { "Content-Type": "image/jpeg" }, body: buf }, "put");
  return f.file_id;
}
async function renderLayer(personBuf, garmentBuf, category) {
  const [personId, garmentId] = [await upload(personBuf, "person.jpg"), await upload(garmentBuf, "garment.jpg")];
  const res = await rfetch(`${BASE}/s2s/v2.0/task/cloth`, {
    method: "POST", headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ src_file_id: personId, ref_file_id: garmentId, garment_category: category }),
  }, "taskpost");
  const taskId = JSON.parse(await res.text()).data?.task_id;
  console.log(`  [${category}] task ${taskId ? "ok" : "FAIL"}`);
  for (let i = 0; i < 40; i++) {
    await sleep(2500);
    try {
      const p = await fetch(`${BASE}/s2s/v2.0/task/cloth/${taskId}`, { headers: auth });
      const d = JSON.parse(await p.text()).data;
      if (d.task_status === "success") { console.log(`  [${category}] success`); return d.results.url; }
      if (d.task_status === "error") { console.log(`  [${category}] ERROR ${d.error}`); return null; }
    } catch (e) { console.log(`  (poll ${i}: ${e?.cause?.code ?? e?.message})`); }
  }
  return null;
}

const personUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=900&fit=crop";
const SHIRT = "https://images.asos-media.com/products/jj-rebel-smart-shirt-in-white/207150537-1-white";
const PANTS = "https://images.asos-media.com/products/asos-design-slim-3-piece-suit-in-blue/210149171-2";
const outFile = process.argv[3] || "/tmp/vto-chain.jpg";

const person = process.argv[2] ? readFileSync(process.argv[2]) : await bytesOf(personUrl, "person");
const shirt = await bytesOf(SHIRT, "shirt");
const pants = await bytesOf(PANTS, "pants");

console.log("\n--- layer 1: shirt (upper_body) ---");
const r1 = await renderLayer(person, shirt, "upper_body");
if (!r1) { console.log("layer 1 failed"); process.exit(1); }

console.log("\n--- layer 2: trousers (lower_body) onto layer-1 result ---");
const r1Bytes = await bytesOf(r1, "render1");
const r2 = await renderLayer(r1Bytes, pants, "lower_body");
if (!r2) { console.log("layer 2 failed"); process.exit(1); }

const final = await bytesOf(r2, "render2");
writeFileSync(outFile, final);
console.log(`\nSAVED chained render -> ${outFile} (${final.length}b)`);
