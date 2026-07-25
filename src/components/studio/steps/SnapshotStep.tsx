import { StepHeading } from "./StepHeading";
import { Button } from "../ui/controls";
import { TrustFooter } from "../ui/TrustFooter";
import type { SkinRead } from "@/lib/studio/types";
import type { ColorSeason } from "@/lib/types";

interface SnapshotStepProps {
  skinRead: SkinRead;
  season?: ColorSeason;
  palette?: string[];
  onNext: () => void;
}

const SEASON_NOTE: Record<ColorSeason, string> = {
  Spring: "warm and light",
  Summer: "cool and soft",
  Autumn: "warm and deep",
  Winter: "cool and clear",
};

export function SnapshotStep({ skinRead, season, palette, onNext }: SnapshotStepProps) {
  const strengths = skinRead.strengths.length ? skinRead.strengths : ["a balanced, healthy base"];

  return (
    <div className="flex flex-1 flex-col">
      <StepHeading kicker="Your skin, at a glance" title="Here's where you're glowing." />
      {skinRead.mock && (
        <p className="mt-1 font-body text-xs text-ink-muted">Sample read - live analysis arrives with the API key.</p>
      )}

      <div className="mt-5 flex flex-col gap-3 rounded-[var(--radius-lg)] bg-surface-card p-[18px]">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3l1.8 4.6L18 9.5l-4.2 1.9L12 16l-1.8-4.6L6 9.5l4.2-1.9L12 3z" fill="var(--color-success-calm)" />
          </svg>
          <span className="font-body text-[13px] font-semibold text-ink">Thriving</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {strengths.map((s) => (
            <span key={s} className="rounded-full bg-bg px-3.5 py-2 font-body text-xs font-medium text-ink-secondary">
              {s}
            </span>
          ))}
        </div>
      </div>

      {skinRead.focusAreas.length > 0 && (
        <div className="mt-3 flex flex-col gap-3 rounded-[var(--radius-lg)] bg-surface-card p-[18px]">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 20s-7-4.4-7-9.3A3.7 3.7 0 0112 8a3.7 3.7 0 017 2.7c0 4.9-7 9.3-7 9.3z"
                stroke="var(--color-accent)"
                strokeWidth="1.7"
              />
            </svg>
            <span className="font-body text-[13px] font-semibold text-ink">A little focus, gently</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {skinRead.focusAreas.map((f) => (
              <span key={f} className="rounded-full bg-accent-soft px-3.5 py-2 font-body text-xs font-semibold text-ink">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {season && (
        <div className="mt-3 flex items-center gap-3 rounded-[var(--radius-lg)] bg-surface-card px-[18px] py-[14px]">
          <div className="flex-1">
            <p className="font-body text-[11px] text-ink-muted">Your colour season</p>
            <p className="font-heading text-base text-ink">
              {season} - {SEASON_NOTE[season]}
            </p>
          </div>
          <div className="flex gap-1.5">
            {(palette ?? []).slice(0, 5).map((c, i) => (
              <span key={`${c}-${i}`} className="h-4 w-4 rounded-full" style={{ background: c }} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-6">
        <TrustFooter />
        <Button onClick={onNext}>That sounds like me</Button>
      </div>
    </div>
  );
}
