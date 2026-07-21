import { Bloom } from "@/components/brand/Bloom";
import { Petal } from "@/components/brand/Petal";
import { PrimaryCta } from "@/components/landing/PrimaryCta";
import { Reveal } from "@/components/landing/Reveal";
import { hero, trust } from "@/lib/landing/content";

const PETALS = [
  { width: 42, color: "var(--color-petal-3)", className: "-top-5 right-12 lg:right-20", rotate: -35 },
  { width: 34, color: "var(--color-petal-1)", className: "left-7 top-10", rotate: 130 },
  { width: 24, color: "var(--color-petal-2)", className: "left-16 top-24 hidden sm:block", rotate: 112 },
  { width: 28, color: "var(--color-accent)", className: "bottom-14 left-10", rotate: 210 },
  { width: 22, color: "var(--color-petal-3)", className: "bottom-8 left-28 hidden lg:block", rotate: 168 },
  { width: 32, color: "var(--color-petal-2)", className: "bottom-14 right-12", rotate: 32 },
  { width: 24, color: "var(--color-petal-1)", className: "right-20 top-28 hidden sm:block", rotate: -18 },
  { width: 18, color: "var(--color-accent)", className: "right-32 bottom-28 hidden lg:block", rotate: 58 },
];

export function TrustBand() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-6 py-24 lg:px-20 lg:py-32">
      <Bloom
        size={360}
        className="pointer-events-none absolute -left-36 top-10 hidden opacity-[0.11] lg:block"
        petalColors={["var(--color-petal-1)", "var(--color-petal-2)", "var(--color-petal-3)"]}
        heartColor="var(--color-accent)"
      />
      <Bloom
        size={420}
        className="pointer-events-none absolute -right-44 bottom-4 hidden rotate-12 opacity-[0.12] lg:block"
        petalColors={["var(--color-petal-2)", "var(--color-petal-3)", "var(--color-accent)"]}
        heartColor="var(--color-gold)"
      />
      <Petal
        width={90}
        color="var(--color-petal-3)"
        className="pointer-events-none absolute -top-5 right-[18%] opacity-60"
        style={{ transform: "rotate(-28deg)" }}
      />
      <Petal
        width={72}
        color="var(--color-petal-2)"
        className="pointer-events-none absolute -bottom-3 left-[16%] opacity-55"
        style={{ transform: "rotate(104deg)" }}
      />

      <Reveal className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="relative min-h-[430px] overflow-hidden rounded-[1.4rem] bg-surface-card px-8 py-20 text-center shadow-[0_24px_70px_rgba(26,26,26,0.09)] lg:min-h-[520px] lg:px-24 lg:py-28">
          {PETALS.map((petal, index) => (
            <Petal
              key={index}
              width={petal.width}
              color={petal.color}
              className={`absolute ${petal.className}`}
              style={{ transform: `rotate(${petal.rotate}deg)` }}
            />
          ))}

          <div className="relative z-10 mx-auto flex min-h-[270px] max-w-3xl flex-col items-center justify-center lg:min-h-[320px]">
            <h2 className="font-heading text-3xl leading-none text-ink lg:text-5xl">
              {trust.title}
            </h2>
            <p className="mx-auto mt-6 font-body text-base leading-relaxed text-ink-secondary lg:text-xl">
              <span>
                {"Ensemble never scores or shames your skin - it leads with what's thriving, and it's built to get medium and deep skin tones right, not as an afterthought."}
              </span>
              <span className="block">Photos are used once and never stored.</span>
            </p>
            <PrimaryCta className="mt-8 px-10 py-4 lg:mt-10">
              {hero.cta}
            </PrimaryCta>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
