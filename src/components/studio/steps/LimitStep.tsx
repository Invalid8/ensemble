import { Bloom } from "@/components/brand/Bloom";
import { Button } from "@/components/ui/button";

/**
 * Running out of looks is not a failure, so it does not read like one. Warm, unhurried,
 * and honest about why the ceiling exists.
 */
export function LimitStep({ message, onRestart }: { message: string; onRestart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-7 px-2 text-center">
      <Bloom size={104} />
      <div className="flex max-w-[320px] flex-col gap-3">
        <h1 className="font-heading text-[26px] leading-tight text-ink">
          Let&apos;s pick this up later.
        </h1>
        <p className="font-body text-sm leading-relaxed text-ink-muted">{message}</p>
        <p className="font-body text-sm leading-relaxed text-ink-muted">
          Your look is still yours. Nothing you shared was stored.
        </p>
      </div>
      <Button variant="secondary" onClick={onRestart}>
        Back to the start
      </Button>
    </div>
  );
}
