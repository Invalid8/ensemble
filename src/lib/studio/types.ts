import type { LookProfile, SkinConditions } from "@/lib/types";

export type StepId =
  | "occasion"
  | "face"
  | "snapshot"
  | "skinType"
  | "goals"
  | "safety"
  | "body"
  | "sizing"
  | "composing"
  | "look";

export const STEP_SEQUENCE: StepId[] = [
  "occasion",
  "face",
  "snapshot",
  "skinType",
  "goals",
  "safety",
  "body",
  "sizing",
  "composing",
  "look",
];

export type LightingState = "unchecked" | "checking" | "ok" | "dark" | "blown";

export interface SkinRead {
  conditions: SkinConditions;
  focusAreas: string[];
  strengths: string[];
  detectedSkinType?: LookProfile["skinType"];
  mock: boolean;
}

export interface SafetyToggles {
  pregnant: boolean;
  sensitive: boolean;
  treatment: boolean;
}
