import { cn } from "@/lib/utils";
import { CaptionChip } from "@/components/landing/CaptionChip";
import { Reveal } from "@/components/landing/Reveal";
import type { Feature } from "@/lib/landing/content";

const CONTAINER = "mx-auto max-w-[1680px] px-6 lg:px-16";

function Steps({ steps }: { steps: NonNullable<Feature["steps"]> }) {
  return (
    <ol className="mt-6 space-y-3">
      {steps.map((step) => (
        <li key={step.number} className="flex items-center gap-3.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft font-body text-[11px] font-bold text-ink">
            {step.number}
          </span>
          <span className="font-body text-sm font-medium text-ink">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

function Note({ note }: { note: string }) {
  return (
    <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-surface-card px-4 py-3">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="var(--color-ink-muted)" strokeWidth="1.6" />
        <path d="M12 11v5M12 8h.01" stroke="var(--color-ink-muted)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="font-body text-xs leading-relaxed text-ink-muted">{note}</span>
    </div>
  );
}

function Tags({ tags }: { tags: string[] }) {
  return (
    <div className="mt-6 flex flex-wrap gap-2.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-border-subtle bg-surface-card px-3.5 py-2 font-body text-xs font-medium text-ink-secondary"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function FeatureText({ feature }: { feature: Feature }) {
  return (
    <div className="max-w-2xl">
      <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        {feature.eyebrow}
      </p>
      <h2 className="mt-4 font-heading text-3xl leading-[1.12] text-ink lg:text-4xl">
        {feature.title}
      </h2>
      <p className="mt-4 font-body text-base leading-relaxed text-ink-secondary">
        {feature.description}
      </p>
      {feature.steps && <Steps steps={feature.steps} />}
      {feature.note && <Note note={feature.note} />}
      {feature.tags && <Tags tags={feature.tags} />}
    </div>
  );
}

function FeatureImage({ feature }: { feature: Feature }) {
  return (
    <div className="relative w-full shrink-0 lg:w-[600px] xl:w-[640px]">
      <div
        className="aspect-[5/4] w-full rounded-[1.4rem] bg-surface-2 bg-cover bg-center shadow-[0_18px_44px_rgba(26,26,26,0.12)]"
        style={{ backgroundImage: `url(${feature.image})` }}
        role="img"
        aria-label={feature.caption}
      />
      {feature.caption && (
        <CaptionChip
          label={feature.caption}
          tone={feature.captionTone}
          className="absolute bottom-5 left-5"
        />
      )}
    </div>
  );
}

export function FeatureSection({ feature }: { feature: Feature }) {
  if (!feature.image) {
    return (
      <Reveal className={CONTAINER}>
        <div className="max-w-3xl">
          <FeatureText feature={feature} />
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal className={CONTAINER}>
      <div
        className={cn(
          "flex flex-col items-center gap-10 lg:gap-28 xl:gap-36",
          feature.imageSide === "left" ? "lg:flex-row" : "lg:flex-row-reverse"
        )}
      >
        <div className="flex w-full lg:flex-1">
          <FeatureText feature={feature} />
        </div>
        <FeatureImage feature={feature} />
      </div>
    </Reveal>
  );
}
