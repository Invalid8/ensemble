export function StepHeading({
  kicker,
  title,
  sub,
}: {
  kicker?: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {kicker && (
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          {kicker}
        </p>
      )}
      <h1 className="font-heading text-[26px] leading-tight text-ink">{title}</h1>
      {sub && <p className="font-body text-sm text-ink-muted">{sub}</p>}
    </div>
  );
}
