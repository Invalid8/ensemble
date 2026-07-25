export function PrivacyNote({ children }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center gap-1.5 text-center font-body text-[11px] leading-snug text-ink-muted">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
        <path
          d="M12 3l7 3v5c0 4.4-3 8.3-7 9.5-4-1.2-7-5.1-7-9.5V6l7-3z"
          stroke="var(--color-success-calm)"
          strokeWidth="1.7"
        />
        <path d="M9 12l2 2 4-4" stroke="var(--color-success-calm)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children ?? "Used only to show this on you - never stored, never shared."}
    </span>
  );
}
