import { BloomLoader } from "../ui/BloomLoader";

export function ComposingStep({ status }: { status: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-7 text-center">
      <BloomLoader size={120} />
      <div className="flex flex-col gap-2">
        <p className="font-heading text-[22px] text-ink">{status}</p>
        <p className="max-w-[260px] font-body text-sm text-ink-muted">
          Putting your whole look together, one piece at a time.
        </p>
      </div>
    </div>
  );
}
