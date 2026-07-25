interface ErrorNoteProps {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
}

export function ErrorNote({ message, onRetry, onDismiss }: ErrorNoteProps) {
  return (
    <div className="mb-4 flex gap-3 rounded-[var(--radius-md)] border border-destructive/25 bg-destructive/8 px-4 py-3.5">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="var(--color-destructive)" strokeWidth="1.7" />
        <path d="M12 8v4.5" stroke="var(--color-destructive)" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="12" cy="16" r="0.4" fill="var(--color-destructive)" stroke="var(--color-destructive)" strokeWidth="1.2" />
      </svg>

      <div className="flex flex-1 flex-col gap-2">
        <p className="font-body text-sm leading-snug text-ink">{message}</p>
        <div className="flex items-center gap-4">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="font-body text-sm font-semibold text-destructive transition-colors hover:text-destructive/80"
            >
              Try again
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="font-body text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
