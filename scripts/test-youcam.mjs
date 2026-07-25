// Verbose live probe of the YouCam 4-step workflow, to confirm real response shapes
// against src/lib/youcam/client.ts assumptions. Reads YOUCAM_API_KEY from .env.local.
// Usage: node scripts/test-youcam.mjs [path-to-face.jpg]
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
const trim = (s) => (s.length > 600 ? s.slice(0, 600) + "…" : s);

async function loadImage(path) {
  if (path) {
    const buf = readFileSync(path);
    console.log(`test image: ${path} (${buf.length} bytes)`);
    return buf;
  }
  const url = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=560&h=720&fit=facearea&facepad=2.2";
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  console.log(`test image: unsplash portrait (${buf.length} bytes, ${res.headers.get("content-type")})`);
  return buf;
}

async function runFeature(feature, taskParams, imgBuf) {
  console.log(`\n===================== ${feature} =====================`);

  const fileRes = await fetch(`${BASE}/s2s/v2.0/file/${feature}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ files: [{ content_type: "image/jpeg", file_name: "face.jpg", file_size: imgBuf.length }] }),
  });
  const fileText = await fileRes.text();
  console.log(`[1 file] HTTP ${fileRes.status}\n${trim(fileText)}`);
  if (!fileRes.ok) return;
  const fileJson = JSON.parse(fileText);

  const first = fileJson.data?.files?.[0] ?? fileJson.result?.[0] ?? fileJson.files?.[0] ?? fileJson;
  const req = Array.isArray(first.requests) ? first.requests[0] : first.requests;
  const uploadUrl = req?.url ?? first.url;
  const uploadMethod = req?.method ?? "PUT";
  const uploadHeaders = req?.headers ?? {};
  const fileId = first.file_id ?? first.fileId;
  console.log(`   -> parsed: file_id=${fileId ? "present" : "MISSING"} uploadUrl=${uploadUrl ? "present" : "MISSING"} method=${uploadMethod} extraHeaders=${Object.keys(uploadHeaders).join(",") || "none"}`);
  if (!uploadUrl) return;

  const putRes = await fetch(uploadUrl, { method: uploadMethod, headers: { "Content-Type": "image/jpeg", ...uploadHeaders }, body: imgBuf });
  console.log(`[2 put ] HTTP ${putRes.status}`);
  if (!putRes.ok) {
    console.log("   put body:", trim(await putRes.text()));
    return;
  }

  const taskRes = await fetch(`${BASE}/s2s/v2.0/task/${feature}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ src_file_id: fileId, ...taskParams }),
  });
  const taskText = await taskRes.text();
  console.log(`[3 task] HTTP ${taskRes.status}\n${trim(taskText)}`);
  if (!taskRes.ok) return;
  const tj = JSON.parse(taskText);
  const taskId = tj.data?.task_id ?? tj.task_id ?? tj.data?.task_ids?.[0] ?? tj.result?.task_id;
  console.log(`   -> task_id=${taskId ? "present" : "MISSING"}`);

  for (let i = 0; i < 15; i++) {
    await sleep(1500);
    const pollRes = await fetch(`${BASE}/s2s/v2.0/task/${feature}/${taskId}`, { headers: auth });
    const pollText = await pollRes.text();
    const pj = JSON.parse(pollText);
    const status = pj.data?.status ?? pj.data?.task_status ?? pj.status ?? pj.task_status;
    if (i === 0) console.log(`[4 poll] status path: ${pj.data?.status !== undefined ? "data.status" : pj.data?.task_status !== undefined ? "data.task_status" : pj.status !== undefined ? "status" : pj.task_status !== undefined ? "task_status" : "?"}`);
    if (status === "success" || status === "error" || status === "failed") {
      console.log(`[4 poll] terminal="${status}"\n${trim(pollText)}`);
      return;
    }
  }
  console.log("[4 poll] timed out");
}

const imgBuf = await loadImage(process.argv[2]);
await runFeature("skin-tone-analysis", { face_angle_strictness_level: "medium" }, imgBuf);
await runFeature("skin-analysis", { dst_actions: ["redness", "oiliness", "moisture", "radiance", "age_spot", "texture", "skin_type"], format: "json" }, imgBuf);
