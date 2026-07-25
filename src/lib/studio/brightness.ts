export type Brightness = "ok" | "dark" | "blown";

export async function checkBrightness(file: File): Promise<Brightness> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const scale = 64 / Math.max(bitmap.width, bitmap.height);
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) return "ok";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let luma = 0;
  for (let i = 0; i < data.length; i += 4) {
    luma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  luma /= data.length / 4;

  if (luma < 60) return "dark";
  if (luma > 235) return "blown";
  return "ok";
}
