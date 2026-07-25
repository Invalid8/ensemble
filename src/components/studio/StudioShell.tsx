import { cn } from "@/lib/utils";
import { Petal } from "@/components/brand/Petal";
import { ProgressDots } from "./ui/controls";

const STAGE_PETALS = [
  { top: "12%", left: "8%", width: 30, rotate: 150, tone: "petal-2" },
  { top: "24%", right: "10%", width: 26, rotate: -40, tone: "petal-1" },
  { bottom: "26%", left: "7%", width: 24, rotate: 120, tone: "petal-3" },
  { bottom: "14%", right: "9%", width: 28, rotate: -140, tone: "petal-2" },
];

function StageScatter() {
  return (
    <div
      className="pointer-events-none absolute inset-0 hidden lg:block"
      aria-hidden
    >
      {STAGE_PETALS.map((p, i) => (
        <Petal
          key={i}
          width={p.width}
          color={`var(--color-${p.tone})`}
          className="absolute"
          style={{
            top: p.top,
            bottom: p.bottom,
            left: p.left,
            right: p.right,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

interface StudioShellProps {
  children: React.ReactNode;
  showBack: boolean;
  onBack: () => void;
  showProgress: boolean;
  progressTotal: number;
  progressCurrent: number;
}

export function StudioShell({
  children,
  showBack,
  onBack,
  showProgress,
  progressTotal,
  progressCurrent,
}: StudioShellProps) {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-bg lg:flex lg:items-center lg:justify-center lg:py-10">
      <StageScatter />

      <div
        className={cn(
          "relative z-10 mx-auto flex h-dvh w-full max-w-[540px] flex-col bg-bg",
          "lg:my-0 lg:h-[860px] lg:min-h-0 lg:rounded-[var(--radius-xl)] lg:border lg:border-border-subtle lg:shadow-[0_30px_80px_rgba(26,26,26,0.08)]",
        )}
      >
        {(showBack || showProgress) && (
          <div className="relative z-10 flex items-center justify-between bg-bg px-6 pb-4 pt-5">
            {showBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Back"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-card text-ink transition-colors hover:bg-accent-soft"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M15 6l-6 6 6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : (
              <span className="h-9 w-9 shrink-0" />
            )}
            {showProgress ? (
              <ProgressDots total={progressTotal} current={progressCurrent} />
            ) : (
              <span />
            )}
            <span className="h-9 w-9 shrink-0" />
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-8 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
