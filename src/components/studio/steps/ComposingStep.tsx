import { BloomLoader } from "../ui/BloomLoader";

export function ComposingStep({ status }: { status: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-7 text-center">
      <BloomLoader size={120} />
      {/* items-center, or the capped sub-line sits against the left edge of the wider heading
          rather than under its middle. */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-balance font-heading text-[22px] leading-snug text-ink">{status}</p>
        <p className="max-w-[280px] text-balance font-body text-sm leading-snug text-ink-muted">
          Putting your whole look together, one piece at a time.
        </p>
      </div>
    </div>
  );
}
