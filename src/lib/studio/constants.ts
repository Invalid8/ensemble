import type { LookProfile } from "@/lib/types";

export const OCCASION_SUGGESTIONS = [
  "tonight's dinner",
  "a job interview",
  "a first date",
  "a wedding",
  "the office",
  "a night out",
];

export const SKIN_TYPES: NonNullable<LookProfile["skinType"]>[] = [
  "oily",
  "dry",
  "combo",
  "sensitive",
];

export const SKIN_GOALS = [
  "even tone",
  "hydration boost",
  "calm redness",
  "brighter glow",
  "oil balance",
];

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export const FITS: NonNullable<LookProfile["fitPref"]>[] = [
  "fitted",
  "regular",
  "relaxed",
];

export const FOCUS_LABELS: Record<string, string> = {
  redness: "Calming focus",
  moisture: "Hydration focus",
  spots: "Tone-evening focus",
  radiance: "Radiance boost",
  oiliness: "Shine-balance focus",
  texture: "Smoothing focus",
};

export const STRENGTH_LABELS: Record<string, string> = {
  redness: "even, calm colour",
  moisture: "well-hydrated skin",
  spots: "even tone",
  radiance: "natural radiance",
  oiliness: "balanced oils",
  texture: "smooth texture",
};
