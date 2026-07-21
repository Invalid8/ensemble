import { Bloom } from "@/components/brand/Bloom";
import { Reveal } from "@/components/landing/Reveal";
import { deletionTest } from "@/lib/landing/content";

const AUTUMN_PETALS = ["#e89a7b", "#dd7e5f", "#cb6a4c"];
const MUTED_PETALS = ["#57534e"];

export function DeletionTest() {
  const { withScan, withoutScan, footnote } = deletionTest;

  return (
    <section className="px-6 py-20 lg:px-20 lg:py-32">
      <Reveal className="mx-auto max-w-7xl">
        <h2 className="mx-auto max-w-3xl text-center font-heading text-3xl leading-[1.15] text-ink lg:text-5xl">
          <span className="block">Take the skin scan away,</span>
          <span className="block">and the look falls apart.</span>
        </h2>

        <div className="mt-10 grid overflow-hidden rounded-[1.4rem] shadow-[0_22px_54px_rgba(26,26,26,0.13)] md:grid-cols-2 lg:mt-12">
          <div
            className="flex min-h-[340px] flex-col items-center justify-center gap-6 px-8 py-20 text-center lg:min-h-[430px] lg:px-14"
            style={{ backgroundImage: "linear-gradient(135deg, #faf6f0, #f0e4d6)" }}
          >
            <Bloom size={150} petalColors={AUTUMN_PETALS} />
            <h3 className="font-heading text-2xl text-ink lg:text-3xl">{withScan.label}</h3>
            <p className="max-w-sm font-body text-base leading-relaxed text-ink-secondary">
              {withScan.body}
            </p>
          </div>

          <div
            className="flex min-h-[340px] flex-col items-center justify-center gap-6 px-8 py-20 text-center lg:min-h-[430px] lg:px-14"
            style={{ backgroundImage: "linear-gradient(60deg, #221d18, #3a3631)" }}
          >
            <Bloom size={150} petalColors={MUTED_PETALS} heartColor="#57534e" />
            <h3 className="font-heading text-2xl text-[#9c9187] lg:text-3xl">{withoutScan.label}</h3>
            <p className="max-w-sm font-body text-base leading-relaxed text-[#7a736b]">
              {withoutScan.body}
            </p>
          </div>
        </div>

        <p className="mt-6 text-center font-body text-sm text-ink-muted">{footnote}</p>
      </Reveal>
    </section>
  );
}
