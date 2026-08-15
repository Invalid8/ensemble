import { Button } from "../ui/controls";
import { ProductRow } from "../ui/ProductRow";
import { TrustFooter } from "../ui/TrustFooter";
import { Petal } from "@/components/brand/Petal";
import type { CompleteLook, LookReason, Product } from "@/lib/types";

// SPEC §6.4b - every checkmark names the input that drove it, so the skin -> outfit
// dependency is visible on the screen rather than only claimed in the pitch.
const REASON_SOURCE_LABELS: Record<LookReason["source"], string> = {
  undertone: "skin-tone API",
  skinCondition: "skin-analysis API",
  occasion: "your occasion",
  climate: "your climate",
  bodyShape: "your fit answers",
  safety: "your safety answers",
};

function CheckMark() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden>
      <path
        d="M2.5 8.5 L6 12 L13.5 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface LookStepProps {
  look: CompleteLook;
  heroUrl: string | null;
  vtoMock: boolean;
  vtoReal: boolean;
  onRestart: () => void;
}

function ShopSection({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  if (products.length === 0) return null;
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="font-heading text-lg text-ink">{title}</h2>
      {products.map((p) => (
        <ProductRow key={p.id} product={p} />
      ))}
    </section>
  );
}

function Hero({
  heroUrl,
  vtoMock,
  vtoReal,
}: {
  heroUrl: string | null;
  vtoMock: boolean;
  vtoReal: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-surface-2 shadow-[0_18px_44px_rgba(26,26,26,0.10)]">
      {heroUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroUrl}
          alt="Your look"
          className="w-full object-cover lg:h-[720px]"
        />
      ) : (
        <div className="flex aspect-[3/4] items-center justify-center font-body text-sm text-ink-muted lg:aspect-auto lg:h-[640px]">
          the outfit, on you
        </div>
      )}
      {vtoMock && (
        <span className="absolute left-3 top-3 rounded-full bg-ink/75 px-3 py-1 font-body text-[11px] text-bg">
          preview - try-on render arrives with the API key
        </span>
      )}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-surface-card px-3.5 py-2 shadow-[0_8px_20px_rgba(26,26,26,0.14)]">
        <Petal width={13} color="var(--color-petal-1)" />
        <span className="font-body text-[11px] font-semibold text-ink">
          {vtoReal ? "shown on you" : "styled for you"}
        </span>
      </div>
    </div>
  );
}

export function LookStep({
  look,
  heroUrl,
  vtoMock,
  vtoReal,
  onRestart,
}: LookStepProps) {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-bg">
      <Petal
        width={30}
        color="var(--color-petal-2)"
        className="absolute left-[4%] top-[8%] hidden lg:block"
        style={{ transform: "rotate(150deg)" }}
      />
      <Petal
        width={26}
        color="var(--color-petal-1)"
        className="absolute right-[5%] top-[22%] hidden lg:block"
        style={{ transform: "rotate(-40deg)" }}
      />
      <Petal
        width={24}
        color="var(--color-petal-3)"
        className="absolute bottom-[10%] right-[6%] hidden lg:block"
        style={{ transform: "rotate(40deg)" }}
      />

      <div className="relative z-10 mx-auto max-w-[1120px] px-6 py-10 lg:px-10 lg:py-16">
        <h1 className="font-heading text-3xl leading-tight text-ink lg:text-[40px]">
          Your look for {look.occasion}.
        </h1>

        <div className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:items-start lg:gap-12">
          <div className="lg:sticky lg:top-10">
            <Hero heroUrl={heroUrl} vtoMock={vtoMock} vtoReal={vtoReal} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-[var(--radius-lg)] bg-surface-card p-5 lg:p-6">
              <p className="font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                Why this works on you
              </p>
              <p className="mt-2 font-heading text-lg leading-relaxed text-ink lg:text-xl">
                {look.rationale}
              </p>
              {look.reasons.length > 0 && (
                <div className="mt-4 border-t border-border-subtle pt-4">
                  <p className="font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    Why this look
                  </p>
                  <ul className="mt-2.5 flex flex-col gap-2">
                    {look.reasons.map((r) => (
                      <li key={r.claim} className="flex items-start gap-2.5">
                        <CheckMark />
                        <span className="font-body text-[13px] leading-snug text-ink-secondary">
                          {r.claim}{" "}
                          <span className="text-ink-muted">({REASON_SOURCE_LABELS[r.source]})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <ShopSection title="The outfit" products={look.outfit.garments} />
            <ShopSection
              title="Skin prep"
              products={look.beauty.skincarePrep}
            />
            <ShopSection title="The finish" products={look.beauty.makeup} />

            <TrustFooter vtoReal={vtoReal} />
            <Button variant="secondary" onClick={onRestart}>
              Start a new look
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
