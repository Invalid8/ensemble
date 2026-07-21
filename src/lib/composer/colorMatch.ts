function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

// Simple RGB Euclidean distance — SPEC.md.md §12 allows this ("ΔE if easy") over full LAB ΔE.
export function hexDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export function nearestHex(target: string, candidates: string[]): string {
  if (candidates.length === 0) throw new Error("nearestHex: no candidates provided");
  return candidates.reduce((best, c) => (hexDistance(target, c) < hexDistance(target, best) ? c : best));
}

export function pickBestMatch<T extends { primary_color_hex: string }>(
  items: T[],
  allowedHexes: string[]
): T | undefined {
  if (items.length === 0) return undefined;
  return items.reduce((best, item) => {
    const bestDist = Math.min(...allowedHexes.map((h) => hexDistance(h, best.primary_color_hex)));
    const itemDist = Math.min(...allowedHexes.map((h) => hexDistance(h, item.primary_color_hex)));
    return itemDist < bestDist ? item : best;
  });
}
