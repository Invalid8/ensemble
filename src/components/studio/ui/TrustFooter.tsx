export function TrustFooter({ vtoReal = false }: { vtoReal?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius-md)] bg-surface-card px-5 py-4">
      <p className="font-body text-[11px] leading-relaxed text-ink-muted">
        This is cosmetic guidance, not medical advice. If something&apos;s concerning you, a dermatologist can help.
      </p>
      <p className="font-body text-[11px] leading-relaxed text-ink-muted">
        A simplified colour match, not a professional colour session.
      </p>
      {/* SPEC §11 - never let a render imply a guaranteed fit. */}
      {vtoReal && (
        <p className="font-body text-[11px] leading-relaxed text-ink-muted">
          The try-on is a visual simulation - drape and fit will vary on the real garment.
        </p>
      )}
    </div>
  );
}
