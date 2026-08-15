import imageCompression from "browser-image-compression";

// Phone cameras hand us 4-12MB HEIC/JPEG frames. YouCam analyses faces fine well below that,
// and the upload is the slowest part of the flow on mobile data - so shrink before the PUT.
// 1600px on the long edge keeps enough detail for skin-analysis to find a face it accepts.
const OPTIONS = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  fileType: "image/jpeg",
  initialQuality: 0.9,
} as const;

// Anything already small enough is passed through untouched - recompressing a 300KB frame
// costs time and quality for nothing.
const SKIP_BELOW_BYTES = 600_000;

export async function compressForUpload(file: File): Promise<File> {
  if (file.size <= SKIP_BELOW_BYTES) return file;
  try {
    const out = await imageCompression(file, OPTIONS);
    // Compression can overshoot on already-optimised images; never upload the bigger one.
    return out.size < file.size ? new File([out], "upload.jpg", { type: "image/jpeg" }) : file;
  } catch {
    // Fail open: a slower upload beats a dead flow mid-demo.
    return file;
  }
}
