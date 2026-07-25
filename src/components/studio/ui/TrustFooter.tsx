export function TrustFooter() {
  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius-md)] bg-surface-card px-5 py-4">
      <p className="font-body text-[11px] leading-relaxed text-ink-muted">
        This is cosmetic guidance, not medical advice. If something&apos;s concerning you, a dermatologist can help.
      </p>
      <p className="font-body text-[11px] leading-relaxed text-ink-muted">
        A simplified colour match, not a professional colour session.
      </p>
    </div>
  );
}
