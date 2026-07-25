import { StepHeading } from "./StepHeading";
import { Button, OptionButton } from "../ui/controls";
import { SKIN_TYPES } from "@/lib/studio/constants";
import type { LookProfile } from "@/lib/types";

const LABELS: Record<NonNullable<LookProfile["skinType"]>, string> = {
  oily: "Oily",
  dry: "Dry",
  combo: "Combination",
  sensitive: "Sensitive",
};

interface SkinTypeStepProps {
  value?: LookProfile["skinType"];
  detected?: LookProfile["skinType"];
  onSelect: (value: NonNullable<LookProfile["skinType"]>) => void;
  onNext: () => void;
}

export function SkinTypeStep({ value, detected, onSelect, onNext }: SkinTypeStepProps) {
  return (
    <div className="flex flex-1 flex-col">
      <StepHeading
        title="What's your skin like, day to day?"
        sub={detected ? `We're reading ${LABELS[detected]} - confirm or change it.` : "No wrong answers - it just helps us prep."}
      />

      <div className="mt-6 flex flex-col gap-2.5">
        {SKIN_TYPES.map((type) => (
          <OptionButton key={type} selected={value === type} onClick={() => onSelect(type)}>
            {LABELS[type]}
          </OptionButton>
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center gap-3 pt-6">
        <button
          type="button"
          onClick={onNext}
          className="font-body text-xs text-ink-muted underline-offset-2 hover:underline"
        >
          Not sure? We&apos;ll read it from your scan.
        </button>
        <Button onClick={onNext} disabled={!value} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}
