import { StepHeading } from "./StepHeading";
import { CaptureFrame } from "../ui/CaptureFrame";
import { PrivacyNote } from "../ui/PrivacyNote";
import { BloomLoader } from "../ui/BloomLoader";
import { Button } from "../ui/controls";
import { cn } from "@/lib/utils";
import type { LightingState } from "@/lib/studio/types";

interface FaceStepProps {
  preview: string | null;
  lighting: LightingState;
  analyzing: boolean;
  onFile: (file: File) => void;
  onAnalyze: () => void;
}

function hintFor(lighting: LightingState): string | undefined {
  if (lighting === "dark") return "A little more light - try facing a window";
  if (lighting === "blown") return "A bit bright - step back from the light";
  if (lighting === "unchecked") return "Center your face in the oval";
  return undefined;
}

function statusFor(lighting: LightingState): string | null {
  if (lighting === "checking") return "Checking the light…";
  if (lighting === "dark") return "A bit too dark for an honest read - retake it.";
  if (lighting === "blown") return "Very bright - step back and retake.";
  return null;
}

export function FaceStep({ preview, lighting, analyzing, onFile, onAnalyze }: FaceStepProps) {
  if (analyzing) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-7 text-center">
        <BloomLoader size={120} />
        <div className="flex flex-col gap-2">
          <p className="font-heading text-[22px] text-ink">Reading your skin…</p>
          <p className="max-w-[260px] font-body text-sm text-ink-muted">
            Undertone, depth, and a few skin notes - just a moment.
          </p>
        </div>
      </div>
    );
  }

  const status = statusFor(lighting);
  const ready = Boolean(preview) && lighting === "ok";

  return (
    <div className="flex flex-1 flex-col">
      <StepHeading
        kicker="Your face"
        title="Now, your skin - first."
        sub="A clear, well-lit selfie. It drives everything that follows."
      />

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        <CaptureFrame guide="face" hint={hintFor(lighting)} preview={preview} onFile={onFile} />
      </div>

      {status && (
        <p
          className={cn(
            "mt-3 text-center font-body text-sm",
            lighting === "dark" || lighting === "blown" ? "text-destructive" : "text-ink-secondary"
          )}
        >
          {status}
        </p>
      )}

      <div className="mt-auto flex flex-col items-center gap-1.5 pt-6">
        {ready && (
          <Button className="mb-1.5" onClick={onAnalyze}>
            Read my skin
          </Button>
        )}
        <p className="font-body text-xs text-ink-muted">Cosmetic guidance from a photo, not medical advice.</p>
        <PrivacyNote />
      </div>
    </div>
  );
}
