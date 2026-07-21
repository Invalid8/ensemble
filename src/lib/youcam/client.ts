import jsonBigint from "json-bigint";

const BASE_URL = "https://yce-api-01.makeupar.com";
const JSONbig = jsonBigint({ useNativeBigInt: true });

export class YouCamApiError extends Error {
  constructor(
    public step: string,
    public statusCode: number,
    public body: string
  ) {
    super(`YouCam API error at ${step}: ${statusCode} ${body}`);
  }
}

function authHeaders(): HeadersInit {
  const apiKey = process.env.YOUCAM_API_KEY;
  if (!apiKey) throw new Error("YOUCAM_API_KEY is not set");
  return { Authorization: `Bearer ${apiKey}` };
}

// YouCam IDs exceed Number.MAX_SAFE_INTEGER (SPEC.md.md §8) — must not round-trip through JSON.parse.
async function parseJsonBig(res: Response): Promise<unknown> {
  const text = await res.text();
  return JSONbig.parse(text);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number, baseDelayMs: number) {
  const jitter = Math.random() * baseDelayMs;
  return Math.min(baseDelayMs * 2 ** attempt + jitter, 15_000);
}

// Field names below are CONFIRMED against docs.perfectcorp.com (2026-07-21) for the
// ai_clothes and ai_skin_tone_analysis (aka "AI Facial Color Tones Analyzer") references —
// see docs/DEVELOPMENT.md §6 for the full findings and what's still open (skin-analysis's
// exact File API shape wasn't independently re-verified but is assumed consistent).
interface UploadSlot {
  file_id: unknown;
  requests: { url: string; method: string };
}

interface CreateTaskResult {
  task_id: unknown;
}

export interface TaskStatus {
  task_status: "success" | "processing" | "error" | string;
  [key: string]: unknown;
}

async function requestUploadSlot(feature: string, contentType: string): Promise<UploadSlot> {
  const res = await fetch(`${BASE_URL}/s2s/v2.0/file/${feature}`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ content_type: contentType }),
  });
  if (!res.ok) throw new YouCamApiError(`file/${feature}`, res.status, await res.text());
  return parseJsonBig(res) as Promise<UploadSlot>;
}

async function uploadFileBytes(uploadUrl: string, method: string, bytes: Buffer, contentType: string): Promise<void> {
  const res = await fetch(uploadUrl, {
    method,
    headers: { "Content-Type": contentType },
    body: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  });
  if (!res.ok) throw new YouCamApiError("file upload PUT", res.status, await res.text());
}

async function createTask(feature: string, payload: Record<string, unknown>): Promise<CreateTaskResult> {
  const res = await fetch(`${BASE_URL}/s2s/v2.0/task/${feature}`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new YouCamApiError(`task/${feature}`, res.status, await res.text());
  return parseJsonBig(res) as Promise<CreateTaskResult>;
}

async function pollTask(
  feature: string,
  taskId: unknown,
  opts: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<TaskStatus> {
  const maxAttempts = opts.maxAttempts ?? 20;
  const baseDelayMs = opts.baseDelayMs ?? 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(`${BASE_URL}/s2s/v2.0/task/${feature}/${taskId}`, {
      headers: authHeaders(),
    });

    if (res.status === 429) {
      await sleep(backoffDelay(attempt, baseDelayMs));
      continue;
    }
    if (!res.ok) throw new YouCamApiError(`task/${feature}/${String(taskId)}`, res.status, await res.text());

    const data = (await parseJsonBig(res)) as TaskStatus;
    if (data.task_status === "success" || data.task_status === "error") return data;

    await sleep(backoffDelay(attempt, baseDelayMs));
  }

  throw new Error(`Polling timed out for ${feature} task ${String(taskId)}`);
}

/**
 * Runs the full 4-step workflow (SPEC.md.md §8): request upload slot, PUT bytes,
 * create task, poll to completion. Units are only charged on success, so this never retries
 * a completed task.
 */
export async function runYouCamWorkflow(opts: {
  feature: string;
  fileBytes: Buffer;
  contentType: string;
  buildTaskPayload: (fileId: unknown) => Record<string, unknown>;
  pollOptions?: { maxAttempts?: number; baseDelayMs?: number };
}): Promise<TaskStatus> {
  const { feature, fileBytes, contentType, buildTaskPayload, pollOptions } = opts;

  const uploadSlot = await requestUploadSlot(feature, contentType);
  await uploadFileBytes(uploadSlot.requests.url, uploadSlot.requests.method, fileBytes, contentType);

  const task = await createTask(feature, buildTaskPayload(uploadSlot.file_id));
  return pollTask(feature, task.task_id, pollOptions);
}
