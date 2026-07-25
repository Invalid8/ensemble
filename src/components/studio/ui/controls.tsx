import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-ink hover:bg-accent/90",
  secondary: "border border-border-subtle bg-surface-card text-ink-secondary hover:border-ink-muted",
  ghost: "text-ink-muted hover:text-ink",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex w-full items-center justify-center rounded-full px-6 py-4 font-body text-[15px] font-semibold transition-colors disabled:opacity-50",
        BUTTON_VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}

interface SelectableProps {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function Chip({ selected, onClick, children }: SelectableProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 font-body text-sm transition-colors",
        selected
          ? "border-accent bg-accent-soft font-semibold text-ink"
          : "border-border-subtle bg-surface-card text-ink-secondary hover:border-ink-muted"
      )}
    >
      {children}
    </button>
  );
}

export function OptionButton({ selected, onClick, children }: SelectableProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-[var(--radius-md)] border px-5 py-4 text-left font-body text-base transition-colors",
        selected
          ? "border-accent bg-accent-soft font-semibold text-ink"
          : "border-border-subtle bg-surface-card font-medium text-ink-secondary hover:border-ink-muted"
      )}
    >
      <span>{children}</span>
      {selected && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 13l4 4L19 7" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i === current ? "w-5 bg-accent" : "w-1.5",
            i < current ? "bg-accent/50" : i > current ? "bg-border-subtle" : ""
          )}
        />
      ))}
    </div>
  );
}
