import { Hero } from "@/components/landing/Hero";
import { ScrollNav } from "@/components/landing/ScrollNav";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { DeletionTest } from "@/components/landing/DeletionTest";
import { TrustBand } from "@/components/landing/TrustBand";
import { Footer } from "@/components/landing/Footer";
import { PetalScatter } from "@/components/landing/PetalScatter";
import { FeatureParallaxBlooms } from "@/components/landing/FeatureParallaxBlooms";
import { features } from "@/lib/landing/content";

export default function Home() {
  return (
    <div className="relative w-full overflow-hidden bg-bg">
      <ScrollNav />
      <PetalScatter />
      <main className="relative">
        <Hero />

        <section
          id="how-it-works"
          className="relative flex flex-col gap-18 overflow-hidden py-16 lg:py-24"
        >
          <FeatureParallaxBlooms />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 text-center lg:px-16">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              How it works
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl font-heading text-3xl leading-[1.12] text-ink sm:text-4xl lg:text-5xl">
              <span className="block">A complete look,</span>
              <span className="block">built from one skin read.</span>
            </h2>
          </div>

          <div className="relative z-10 flex flex-col gap-18 lg:gap-28">
            {features.map((feature) => (
              <FeatureSection key={feature.title} feature={feature} />
            ))}
          </div>
        </section>

        <DeletionTest />
        <TrustBand />
        <Footer />
      </main>
    </div>
  );
}
