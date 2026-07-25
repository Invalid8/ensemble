interface ErrorNoteProps {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
}

export function ErrorNote({ message, onRetry, onDismiss }: ErrorNoteProps) {
  return (
    <div className="mb-4 flex gap-3 rounded-[var(--radius-md)] border border-destructive/25 bg-destructive/8 px-4 py-3.5">
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
