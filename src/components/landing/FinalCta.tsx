import { Reveal } from "@/components/landing/Reveal";
import { PrimaryCta } from "@/components/landing/PrimaryCta";
import { hero } from "@/lib/landing/content";

export function FinalCta() {
  return (
    <section className="px-6 pb-20 lg:px-20">
      <Reveal className="flex justify-center">
        <PrimaryCta>{hero.cta}</PrimaryCta>
      </Reveal>
    </section>
  );
}
