/**
 * Catalog images are stored as `/catalog/<id>.jpg`. Point NEXT_PUBLIC_CATALOG_CDN at a bucket
 * (R2, or any host) to serve them from there instead; unset, the copies in public/ are used.
 *
 * Whatever serves them must answer datacenter IPs: the try-on fetches the garment server-side,
 * and ASOS's own CDN 403s Vercel, which is what took the render down.
 */
const CDN = process.env.NEXT_PUBLIC_CATALOG_CDN?.replace(/\/$/, "");

export function catalogImageUrl(path: string): string {
  if (!path || !path.startsWith("/catalog/")) return path;
  return CDN ? `${CDN}${path.slice("/catalog".length)}` : path;
}
