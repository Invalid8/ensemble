"use client";

import { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useStudioStore } from "@/lib/studio/store";
import { STEP_SEQUENCE, type StepId } from "@/lib/studio/types";
import { StudioShell } from "./StudioShell";
import { ErrorNote } from "./ui/ErrorNote";
import { OccasionStep } from "./steps/OccasionStep";
import { FaceStep } from "./steps/FaceStep";
import { SnapshotStep } from "./steps/SnapshotStep";
import { SkinTypeStep } from "./steps/SkinTypeStep";
import { GoalsStep } from "./steps/GoalsStep";
import { SafetyStep } from "./steps/SafetyStep";
import { BodyStep } from "./steps/BodyStep";
import { SizingStep } from "./steps/SizingStep";
import { ComposingStep } from "./steps/ComposingStep";
import { LookStep } from "./steps/LookStep";
import { LimitStep } from "./steps/LimitStep";

const PROGRESS_STEPS: StepId[] = ["face", "snapshot", "skinType", "goals", "safety", "body", "sizing"];

// The mount gate never changes after hydration, so it needs no subscription - the server
// snapshot returns false and the client snapshot returns true.
const subscribeNever = () => () => {};

function CurrentStep() {
  const s = useStudioStore(
    useShallow((st) => ({
      step: st.step,
      profile: st.profile,
      facePreview: st.facePreview,
      lighting: st.lighting,
      analyzing: st.analyzing,
      skinRead: st.skinRead,
      goals: st.goals,
      safety: st.safety,
      bodyPreview: st.bodyPreview,
      composeStatus: st.composeStatus,
    }))
  );
  const a = useStudioStore(
    useShallow((st) => ({
      patchProfile: st.patchProfile,
      next: st.next,
      submitFace: st.submitFace,
      analyzeFace: st.analyzeFace,
      selectSkinType: st.selectSkinType,
      toggleGoal: st.toggleGoal,
      toggleSafety: st.toggleSafety,
      submitBody: st.submitBody,
    }))
  );

  switch (s.step) {
    case "occasion":
      return (
        <OccasionStep
          occasion={s.profile.occasion ?? ""}
          country={s.profile.country ?? ""}
          wardrobe={s.profile.wardrobe}
          onOccasion={(v) => a.patchProfile({ occasion: v })}
          onCountry={(v) => a.patchProfile({ country: v })}
          onWardrobe={(w) => a.patchProfile({ wardrobe: w })}
          onNext={a.next}
        />
      );
    case "face":
      return (
        <FaceStep
          preview={s.facePreview}
          lighting={s.lighting}
          analyzing={s.analyzing}
          onFile={a.submitFace}
          onAnalyze={a.analyzeFace}
        />
      );
    case "snapshot":
      return s.skinRead ? (
        <SnapshotStep skinRead={s.skinRead} season={s.profile.colorSeason} palette={s.profile.palette} onNext={a.next} />
      ) : null;
    case "skinType":
      return (
        <SkinTypeStep
          value={s.profile.skinType}
          detected={s.skinRead?.detectedSkinType}
          onSelect={a.selectSkinType}
          onNext={a.next}
        />
      );
    case "goals":
      return <GoalsStep goals={s.goals} onToggle={a.toggleGoal} onNext={a.next} />;
    case "safety":
      return <SafetyStep value={s.safety} onToggle={a.toggleSafety} onNext={a.next} />;
    case "body":
      return <BodyStep preview={s.bodyPreview} onFile={a.submitBody} onNext={a.next} />;
    case "sizing":
      return (
        <SizingStep
          size={s.profile.size}
          fit={s.profile.fitPref}
          onSize={(size) => a.patchProfile({ size })}
          onFit={(fitPref) => a.patchProfile({ fitPref })}
          onNext={a.next}
        />
      );
    case "composing":
      return <ComposingStep status={s.composeStatus} />;
    default:
      return null;
  }
}

export default function StudioFlow() {
  const step = useStudioStore((s) => s.step);
  const direction = useStudioStore((s) => s.direction);
  const error = useStudioStore((s) => s.error);
  const back = useStudioStore((s) => s.back);
  const analyzeFace = useStudioStore((s) => s.analyzeFace);
  const clearError = useStudioStore((s) => s.clearError);
  const runCompose = useStudioStore((s) => s.runCompose);
  const look = useStudioStore((s) => s.look);
  const vtoUrl = useStudioStore((s) => s.vtoUrl);
  const vtoMock = useStudioStore((s) => s.vtoMock);
  const reset = useStudioStore((s) => s.reset);
  const goTo = useStudioStore((s) => s.goTo);
  const limited = useStudioStore((s) => s.limited);

  // The zustand store is a module singleton, so its state can leak across server renders.
  // Gate on mount so SSR and the first client render agree, then hydrate the live flow.
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);

  useEffect(() => {
    if (step === "composing") void runCompose();
  }, [step, runCompose]);

  // The finished look is its own page: push a history entry so a browser/phone back
  // gesture swipes back into the flow instead of leaving the studio.
  useEffect(() => {
    if (step !== "look") return;
    window.history.pushState({ ensemble: "look" }, "");
    const onPop = () => goTo("sizing");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [step, goTo]);

  if (!mounted) return <div className="min-h-dvh w-full bg-bg" />;

  // Out of looks takes over the whole screen - it is a state of the visitor, not of a step.
  if (limited) {
    return (
      <StudioShell showBack={false} onBack={back} showProgress={false} progressTotal={0} progressCurrent={0}>
        <LimitStep message={limited} onRestart={reset} />
      </StudioShell>
    );
  }

  if (step === "look" && look) {
    return (
      <LookStep
        look={look}
        heroUrl={vtoUrl ?? look.outfit.garments[0]?.image_url ?? null}
        vtoMock={vtoMock}
        vtoReal={Boolean(vtoUrl) && !vtoMock}
        onRestart={reset}
      />
    );
  }

  const index = STEP_SEQUENCE.indexOf(step);
  const showBack = index > 0 && step !== "composing" && step !== "look";
  const showProgress = PROGRESS_STEPS.includes(step);

  return (
    <StudioShell
      showBack={showBack}
      onBack={back}
      showProgress={showProgress}
      progressTotal={PROGRESS_STEPS.length}
      progressCurrent={PROGRESS_STEPS.indexOf(step)}
    >
      {error && (
        <ErrorNote
          message={error}
          onRetry={step === "face" ? analyzeFace : undefined}
          onDismiss={clearError}
        />
      )}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            initial={{ x: direction > 0 ? 28 : -28, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            <CurrentStep />
          </motion.div>
        </AnimatePresence>
      </div>
    </StudioShell>
  );
}
