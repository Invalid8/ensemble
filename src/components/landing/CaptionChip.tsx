import { cn } from "@/lib/utils";
import { Petal } from "@/components/brand/Petal";
import type { PetalTone } from "@/lib/landing/content";

interface CaptionChipProps {
  label: string;
  tone?: PetalTone;
  className?: string;
}

export function CaptionChip({ label, tone = "petal-1", className }: CaptionChipProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-surface-card px-4 py-2.5",
        "shadow-[0_8px_22px_rgba(26,26,26,0.12)]",
        className
      )}
    >
      <Petal width={14} color={`var(--color-${tone})`} />
      <span className="font-body text-xs font-semibold text-ink">{label}</span>
    </div>
  );
}
