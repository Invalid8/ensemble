import { StepHeading } from "./StepHeading";
import { Button, OptionButton } from "../ui/controls";
import type { SafetyToggles } from "@/lib/studio/types";

const OPTIONS: { key: keyof SafetyToggles; label: string }[] = [
  { key: "pregnant", label: "Pregnant or nursing" },
  { key: "sensitive", label: "Sensitive skin" },
  { key: "treatment", label: "On a skin treatment" },
];

interface SafetyStepProps {
  value: SafetyToggles;
  onToggle: (key: keyof SafetyToggles) => void;
  onNext: () => void;
}

export function SafetyStep({ value, onToggle, onNext }: SafetyStepProps) {
  const anyFlagged = value.pregnant || value.sensitive || value.treatment;

  return (
    <div className="flex flex-1 flex-col">
      <StepHeading
        title="Anything we should be gentle around?"
        sub="This quietly filters what we suggest - nothing more."
      />

      <div className="mt-6 flex flex-col gap-2.5">
        {OPTIONS.map(({ key, label }) => (
          <OptionButton key={key} selected={value[key]} onClick={() => onToggle(key)}>
            {label}
          </OptionButton>
        ))}
      </div>

      <div className="mt-auto pt-6">
        <Button onClick={onNext}>{anyFlagged ? "Noted - continue" : "Nothing to flag"}</Button>
      </div>
    </div>
  );
}
