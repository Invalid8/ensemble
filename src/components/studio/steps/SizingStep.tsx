import { StepHeading } from "./StepHeading";
import { Button, Chip } from "../ui/controls";
import { FITS, SIZES } from "@/lib/studio/constants";
import type { LookProfile } from "@/lib/types";

interface SizingStepProps {
  size?: string;
  fit?: LookProfile["fitPref"];
  onSize: (size: string) => void;
  onFit: (fit: NonNullable<LookProfile["fitPref"]>) => void;
  onNext: () => void;
}

export function SizingStep({ size, fit, onSize, onFit, onNext }: SizingStepProps) {
  return (
    <div className="flex flex-1 flex-col">
      <StepHeading title="Last one - sizing." sub="Just so the shop links land on the right size." />

      <p className="mt-6 mb-2.5 font-body text-sm font-medium text-ink">Your usual size</p>
      <div className="flex flex-wrap gap-2">
        {SIZES.map((s) => (
          <Chip key={s} selected={size === s} onClick={() => onSize(s)}>
            {s}
          </Chip>
        ))}
      </div>

      <p className="mt-5 mb-2.5 font-body text-sm font-medium text-ink">How you like things to sit</p>
      <div className="flex flex-wrap gap-2">
        {FITS.map((f) => (
          <Chip key={f} selected={fit === f} onClick={() => onFit(f)}>
            {f}
          </Chip>
        ))}
      </div>

      <div className="mt-auto pt-6">
        <Button onClick={onNext} disabled={!size || !fit}>
          See my look
        </Button>
      </div>
    </div>
  );
}
