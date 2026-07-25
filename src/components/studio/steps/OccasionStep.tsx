import { StepHeading } from "./StepHeading";
import { Button, Chip } from "../ui/controls";
import { Logo } from "@/components/brand/Logo";
import { OCCASION_SUGGESTIONS } from "@/lib/studio/constants";
import { cn } from "@/lib/utils";
import type { Wardrobe } from "@/lib/types";

const WARDROBES: { value: Wardrobe; label: string }[] = [
  { value: "women", label: "Women's" },
  { value: "men", label: "Men's" },
];

function Field({
  icon,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-accent">{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[var(--radius-md)] border border-border-subtle bg-surface-card py-4 pl-11 pr-4 font-body text-[15px] text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
      />
    </div>
  );
}

const SparklesIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 3l1.8 4.6L18 9.5l-4.2 1.9L12 16l-1.8-4.6L6 9.5l4.2-1.9L12 3z" fill="currentColor" />
  </svg>
);

const PinIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

interface OccasionStepProps {
  occasion: string;
  country: string;
  wardrobe?: Wardrobe;
  onOccasion: (v: string) => void;
  onCountry: (v: string) => void;
  onWardrobe: (w: Wardrobe) => void;
  onNext: () => void;
}

export function OccasionStep({ occasion, country, wardrobe, onOccasion, onCountry, onWardrobe, onNext }: OccasionStepProps) {
  return (
    <div className="flex flex-1 flex-col">
      <Logo className="mb-7" />
      <StepHeading title="Let's get you ready." sub="What are we dressing you for today?" />

      <div className="mt-6 flex flex-col gap-3">
        <Field icon={SparklesIcon} value={occasion} onChange={onOccasion} placeholder="Tonight's dinner, a job interview…" />
        <Field icon={PinIcon} value={country} onChange={onCountry} placeholder="Add your country (for the weather)" />
        <div className="flex flex-wrap gap-2 pt-1">
          {OCCASION_SUGGESTIONS.map((s) => (
            <Chip key={s} selected={occasion === s} onClick={() => onOccasion(s)}>
              {s}
            </Chip>
          ))}
        </div>

        <div className="pt-2">
          <p className="mb-2 font-body text-[13px] font-medium text-ink-secondary">Whose wardrobe are we styling?</p>
          <div className="grid grid-cols-2 gap-2">
            {WARDROBES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onWardrobe(value)}
                className={cn(
                  "rounded-[var(--radius-md)] border px-4 py-3 font-body text-sm transition-colors",
                  wardrobe === value
                    ? "border-accent bg-accent-soft font-semibold text-ink"
                    : "border-border-subtle bg-surface-card text-ink-secondary hover:border-ink-muted"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Button onClick={onNext} disabled={!occasion.trim() || !wardrobe}>
          Get your look
        </Button>
      </div>
    </div>
  );
}
