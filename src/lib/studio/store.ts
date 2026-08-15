import { create } from "zustand";
import catalogJson from "@/data/catalog.json";
import { composeLook, getClimateSeason } from "@/lib/composer";
import { checkBrightness } from "@/lib/studio/brightness";
import { QuotaError, readSkin, renderVto } from "@/lib/studio/client";
import { STEP_SEQUENCE } from "@/lib/studio/types";
import type { LightingState, SafetyToggles, SkinRead, StepId } from "@/lib/studio/types";
import type { CompleteLook, LookProfile, Product } from "@/lib/types";

const catalog = catalogJson as Product[];
const NO_BACK: StepId[] = ["composing", "look"];

interface StudioState {
  step: StepId;
  direction: number;
  profile: LookProfile;
  faceFile: File | null;
  facePreview: string | null;
  lighting: LightingState;
  analyzing: boolean;
  skinRead: SkinRead | null;
  goals: string[];
  safety: SafetyToggles;
  bodyFile: File | null;
  bodyPreview: string | null;
  composeStatus: string;
  composeStarted: boolean;
  look: CompleteLook | null;
  vtoUrl: string | null;
  vtoMock: boolean;
  /** Why the look is showing catalog imagery instead of the visitor's own try-on. */
  vtoNote: string | null;
  error: string | null;
  /** Set when the visitor has used their allowance of looks. Owns the whole screen, not a note. */
  limited: string | null;
}

interface StudioActions {
  patchProfile: (patch: Partial<LookProfile>) => void;
  next: () => void;
  back: () => void;
  goTo: (target: StepId) => void;
  submitFace: (file: File) => Promise<void>;
  analyzeFace: () => Promise<void>;
  selectSkinType: (type: NonNullable<LookProfile["skinType"]>) => void;
  toggleGoal: (goal: string) => void;
  toggleSafety: (key: keyof SafetyToggles) => void;
  submitBody: (file: File) => void;
  runCompose: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const INITIAL: StudioState = {
  step: "occasion",
  direction: 1,
  profile: {},
  faceFile: null,
  facePreview: null,
  lighting: "unchecked",
  analyzing: false,
  skinRead: null,
  goals: [],
  safety: { pregnant: false, sensitive: false, treatment: false },
  bodyFile: null,
  bodyPreview: null,
  composeStatus: "Reading your skin…",
  composeStarted: false,
  look: null,
  vtoUrl: null,
  vtoMock: false,
  vtoNote: null,
  error: null,
  limited: null,
};

export const useStudioStore = create<StudioState & StudioActions>((set, get) => ({
  ...INITIAL,

  patchProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

  next: () =>
    set((s) => {
      const at = STEP_SEQUENCE.indexOf(s.step);
      return { step: STEP_SEQUENCE[at + 1] ?? s.step, direction: 1 };
    }),

  back: () =>
    set((s) => {
      const at = STEP_SEQUENCE.indexOf(s.step);
      if (NO_BACK.includes(s.step) || at <= 0) return {};
      return { step: STEP_SEQUENCE[at - 1], direction: -1 };
    }),

  goTo: (target) => set({ step: target, direction: 1 }),

  submitFace: async (file) => {
    set({ error: null, faceFile: file, facePreview: URL.createObjectURL(file), lighting: "checking" });
    const lighting = await checkBrightness(file);
    set({ lighting });
  },

  analyzeFace: async () => {
    const { faceFile, lighting } = get();
    if (!faceFile || lighting !== "ok") return;

    set({ analyzing: true, error: null });
    try {
      const { profilePatch, skinRead } = await readSkin(faceFile);
      set((s) => ({ profile: { ...s.profile, ...profilePatch }, skinRead, analyzing: false }));
      get().next();
    } catch (e) {
      if (e instanceof QuotaError) {
        set({ analyzing: false, limited: e.message });
        return;
      }
      set({
        analyzing: false,
        error: e instanceof Error ? e.message : "We couldn't read that photo - mind trying another?",
      });
    }
  },

  selectSkinType: (type) => get().patchProfile({ skinType: type }),

  toggleGoal: (goal) =>
    set((s) => ({
      goals: s.goals.includes(goal) ? s.goals.filter((g) => g !== goal) : [...s.goals, goal].slice(-2),
    })),

  toggleSafety: (key) => set((s) => ({ safety: { ...s.safety, [key]: !s.safety[key] } })),

  submitBody: (file) => set({ bodyFile: file, bodyPreview: URL.createObjectURL(file) }),

  runCompose: async () => {
    if (get().composeStarted) return;
    set({ composeStarted: true });

    const { profile, goals, safety, bodyFile } = get();
    const finalProfile: LookProfile = {
      ...profile,
      skinGoals: goals,
      climateSeason: getClimateSeason(profile.country || "Nigeria"),
      safetyFlags: {
        pregnant: safety.pregnant,
        breastfeeding: false,
        sensitivities: safety.sensitive ? ["sensitive"] : [],
        activeTreatment: safety.treatment,
        allergies: [],
      },
    };

    set({ profile: finalProfile, composeStatus: "Choosing your palette…" });
    const look = composeLook(finalProfile, catalog);
    set({ look });

    if (bodyFile) {
      set({ composeStatus: "Rendering the outfit on you…" });
      try {
        const vto = await renderVto(bodyFile, look.outfit.garments);
        set({
          vtoUrl: vto.url,
          vtoMock: vto.mock,
          // A render that comes back empty is still a miss - say so rather than let the
          // catalog photo pass for the visitor's own try-on.
          vtoNote: vto.url ? null : "We couldn't render this one on you, so you're seeing the piece as shot.",
        });
      } catch (e) {
        // Running out mid-compose still has a look to show, so fall through to garment
        // imagery rather than throwing the visitor out at the last step - but never let the
        // fallback masquerade as a try-on. The visitor asked to be shown wearing this.
        set({
          vtoUrl: null,
          vtoMock: false,
          vtoNote:
            e instanceof QuotaError
              ? "You're out of try-on renders for now, so you're seeing the piece as shot."
              : "The try-on didn't come back this time, so you're seeing the piece as shot.",
        });
      }
    }

    set({ composeStatus: "Tying it all together…" });
    window.setTimeout(() => get().goTo("look"), 700);
  },

  clearError: () => set({ error: null }),

  reset: () => set({ ...INITIAL, profile: {}, goals: [], safety: { ...INITIAL.safety } }),
}));
