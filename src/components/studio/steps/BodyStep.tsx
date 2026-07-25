import { StepHeading } from "./StepHeading";
import { CaptureFrame } from "../ui/CaptureFrame";
import { PrivacyNote } from "../ui/PrivacyNote";
import { Button } from "../ui/controls";

interface BodyStepProps {
  preview: string | null;
  onFile: (file: File) => void;
  onNext: () => void;
}

export function BodyStep({ preview, onFile, onNext }: BodyStepProps) {
  return (
    <div className="flex flex-1 flex-col">
      <StepHeading
        kicker="Full-length"
        title="Now, the outfit canvas."
        sub="A full-length photo, so we can show the look on you."
      />

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        <CaptureFrame guide="body" hint="Stand where we can see your full outfit" preview={preview} onFile={onFile} />
      </div>

      <div className="mt-auto flex flex-col items-center gap-1.5 pt-6">
        {preview && (
          <Button className="mb-1.5" onClick={onNext}>
            Use this photo
          </Button>
        )}
        <PrivacyNote />
      </div>
    </div>
  );
}
