import type { Undertone } from "@/lib/types";

interface Lab {
  l: number;
  a: number;
  b: number;
}

function srgbChannelToLinear(channel255: number): number {
  const v = channel255 / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

// sRGB (D65) -> CIE XYZ -> CIE Lab. Used because skin-tone research classifies depth via L*
// and warmth via the a*/b* plane (ITA°-style) — far more reliable than thresholding raw hue
// on a single hex, since skin hues all cluster tightly in the orange-red family regardless
// of undertone (DEVELOPMENT.md §6 item 2 — no undertone/Fitzpatrick field is returned by the
// confirmed skin-tone-analysis response, so this derives from its `skin_color` hex instead).
export function hexToLab(hex: string): Lab {
  const clean = hex.replace("#", "");
  const r = srgbChannelToLinear(parseInt(clean.substring(0, 2), 16));
  const g = srgbChannelToLinear(parseInt(clean.substring(2, 4), 16));
  const b = srgbChannelToLinear(parseInt(clean.substring(4, 6), 16));

  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  // Normalize by the D65 reference white point.
  const xn = x / 0.95047;
  const yn = y / 1.0;
  const zn = z / 1.08883;

  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const fx = f(xn);
  const fy = f(yn);
  const fz = f(zn);

  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

export type Depth = "light-medium" | "medium-deep";

/** Skin depth from L* (perceptual lightness). Threshold is a coarse midpoint, not clinical. */
export function deriveDepthFromLightness(skinColorHex: string): Depth {
  return hexToLab(skinColorHex).l >= 60 ? "light-medium" : "medium-deep";
}

/**
 * Undertone from the angle in the Lab a-b chroma plane: closer to the +b (yellow) axis reads
 * warm, closer to the +a (red/pink) axis reads cool, the band between is called neutral. Still
 * a simplification (SPEC.md.md §11's "simplified engine" note applies) — swap for a real API
 * field immediately if the Playground ever exposes one.
 */
export function deriveUndertone(skinColorHex: string): Undertone {
  const { a, b } = hexToLab(skinColorHex);
  const angleDeg = (Math.atan2(b, a) * 180) / Math.PI;

  if (angleDeg >= 55) return "warm";
  if (angleDeg <= 35) return "cool";
  return "neutral";
}

export function deriveUndertoneAndDepth(skinColorHex: string): { undertone: Undertone; depth: Depth } {
  return { undertone: deriveUndertone(skinColorHex), depth: deriveDepthFromLightness(skinColorHex) };
}
