import jsonBigint from "json-bigint";

const BASE_URL = "https://yce-api-01.makeupar.com";
const JSONbig = jsonBigint({ useNativeBigInt: true });

// Response shapes below are CONFIRMED against the live API (probed 2026-07-25):
//   file: POST {files:[{content_type,file_name,file_size}]}
//         -> {data:{files:[{file_id, requests:[{method,url}]}]}}
//   task: POST {src_file_id, ...params} -> {data:{task_id}}
//   poll: GET  -> {data:{task_status:"success"|"error"|..., error, results}}

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

async function parseJsonBig<T>(res: Response): Promise<T> {
  return JSONbig.parse(await res.text()) as T;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function backoffDelay(attempt: number, baseDelayMs: number) {
  const jitter = Math.random() * baseDelayMs;
  return Math.min(baseDelayMs * 2 ** attempt + jitter, 15_000);
}

const TRANSIENT_CODES = new Set([
  "UND_ERR_CONNECT_TIMEOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ENETUNREACH",
]);

function isTransientNetworkError(err: unknown): boolean {
  const e = err as { name?: string; code?: string; cause?: { code?: string } };
  if (e?.name === "TimeoutError") return true;
  const code = e?.cause?.code ?? e?.code;
  return code != null && TRANSIENT_CODES.has(code);
}

// A single flaky TCP connect to YouCam's host shouldn't sink the whole read - retry the
// transient ones on a fresh connection before giving up.
async function netFetch(url: string, init: RequestInit, label: string, attempts = 3): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(25_000) });
    } catch (err) {
      lastErr = err;
      if (!isTransientNetworkError(err) || attempt === attempts - 1) break;
      await sleep(600 * 2 ** attempt);
    }
  }
  const e = lastErr as { cause?: { code?: string }; code?: string; message?: string };
  const reason = e?.cause?.code ?? e?.code ?? e?.message ?? "fetch failed";
  throw new YouCamApiError(label, 0, `network error (${reason})`);
}

interface FileSlot {
  fileId: unknown;
  uploadUrl: string;
  uploadMethod: string;
}

export interface YouCamResult {
  task_status: "success" | "error" | "processing" | string;
  error: string | null;
  results: Record<string, unknown> | null;
}

async function requestUploadSlot(feature: string, contentType: string, fileSize: number): Promise<FileSlot> {
  const res = await netFetch(
    `${BASE_URL}/s2s/v2.0/file/${feature}`,
    {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ files: [{ content_type: contentType, file_name: "upload", file_size: fileSize }] }),
    },
    `file/${feature}`
  );
  if (!res.ok) throw new YouCamApiError(`file/${feature}`, res.status, await res.text());

  const json = await parseJsonBig<{
    data: { files: { file_id: unknown; requests: { method: string; url: string }[] }[] };
  }>(res);
  const file = json.data.files[0];
  return { fileId: file.file_id, uploadUrl: file.requests[0].url, uploadMethod: file.requests[0].method };
}

async function uploadFileBytes(uploadUrl: string, method: string, bytes: Buffer, contentType: string): Promise<void> {
  const res = await netFetch(
    uploadUrl,
    {
      method,
      headers: { "Content-Type": contentType },
      body: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    },
    "file upload PUT"
  );
  if (!res.ok) throw new YouCamApiError("file upload PUT", res.status, await res.text());
}

async function createTask(feature: string, payload: Record<string, unknown>): Promise<unknown> {
  const res = await netFetch(
    `${BASE_URL}/s2s/v2.0/task/${feature}`,
    {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    `task/${feature}`
  );
  if (!res.ok) throw new YouCamApiError(`task/${feature}`, res.status, await res.text());
  return (await parseJsonBig<{ data: { task_id: unknown } }>(res)).data.task_id;
}

async function pollTask(
  feature: string,
  taskId: unknown,
  opts: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<YouCamResult> {
  const maxAttempts = opts.maxAttempts ?? 20;
  const baseDelayMs = opts.baseDelayMs ?? 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await netFetch(
      `${BASE_URL}/s2s/v2.0/task/${feature}/${taskId}`,
      { headers: authHeaders() },
      `task/${feature}/${String(taskId)}`
    );

    if (res.status === 429) {
      await sleep(backoffDelay(attempt, baseDelayMs));
      continue;
    }
    if (!res.ok) throw new YouCamApiError(`task/${feature}/${String(taskId)}`, res.status, await res.text());

    const { data } = await parseJsonBig<{ data: YouCamResult }>(res);
    if (data.task_status === "success" || data.task_status === "error") return data;

    await sleep(backoffDelay(attempt, baseDelayMs));
  }

  throw new Error(`Polling timed out for ${feature} task ${String(taskId)}`);
}

/** File -> PUT -> task -> poll. Returns the poll's `data` ({ task_status, error, results }). */
export async function runYouCamWorkflow(opts: {
  feature: string;
  fileBytes: Buffer;
  contentType: string;
  buildTaskPayload: (fileId: unknown) => Record<string, unknown>;
  pollOptions?: { maxAttempts?: number; baseDelayMs?: number };
}): Promise<YouCamResult> {
  const { feature, fileBytes, contentType, buildTaskPayload, pollOptions } = opts;

  const slot = await requestUploadSlot(feature, contentType, fileBytes.length);
  await uploadFileBytes(slot.uploadUrl, slot.uploadMethod, fileBytes, contentType);
  const taskId = await createTask(feature, buildTaskPayload(slot.fileId));
  return pollTask(feature, taskId, pollOptions);
}
