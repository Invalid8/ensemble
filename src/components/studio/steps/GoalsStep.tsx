import { StepHeading } from "./StepHeading";
import { Button, Chip } from "../ui/controls";
import { SKIN_GOALS } from "@/lib/studio/constants";

interface GoalsStepProps {
  goals: string[];
  onToggle: (goal: string) => void;
  onNext: () => void;
}

export function GoalsStep({ goals, onToggle, onNext }: GoalsStepProps) {
  return (
    <div className="flex flex-1 flex-col">
      <StepHeading title="Anything you'd love to work toward?" sub="Pick up to two, or skip." />

      <div className="mt-6 flex flex-wrap gap-2.5">
        {SKIN_GOALS.map((goal) => (
          <Chip key={goal} selected={goals.includes(goal)} onClick={() => onToggle(goal)}>
            {goal}
          </Chip>
        ))}
      </div>

      <div className="mt-auto pt-6">
        <Button variant={goals.length ? "primary" : "secondary"} onClick={onNext}>
          {goals.length ? "That's everything" : "Skip for now"}
        </Button>
      </div>
    </div>
  );
}
