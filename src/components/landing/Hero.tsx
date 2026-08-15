import { hero } from "@/lib/landing/content";
import { Logo } from "@/components/brand/Logo";
import { PrimaryCta } from "@/components/landing/PrimaryCta";
import { HeroColumns, HeroRows } from "@/components/landing/HeroMasonry";
import { heroPreloads } from "@/lib/landing/images";

export function Hero() {
  return (
    <section className="relative overflow-hidden lg:flex lg:min-h-screen lg:flex-col">
      {heroPreloads.map(({ src, media }) => (
        <link
          key={src}
          rel="preload"
          as="image"
          href={src}
          type="image/webp"
          media={media}
        />
      ))}
      <div
        className="absolute -right-[4vw] top-0 hidden h-full w-[47%] lg:block"
        aria-hidden
      >
        <HeroColumns className="h-full" />
      </div>

      <div className="relative z-10 flex flex-col lg:w-[55%] lg:flex-1 xl:w-[57%]">
        <header className="flex items-center justify-between px-6 py-5 lg:px-20 lg:py-7">
          <Logo />
        </header>

        <div className="px-6 pb-4 pt-6 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-20 lg:pb-16 lg:pt-8">
          <h1 className="max-w-3xl font-heading text-4xl leading-[1.12] text-ink sm:text-5xl lg:max-w-[36rem] lg:text-[4.25rem] xl:max-w-[42rem] xl:text-[5.25rem]">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-2xl font-body text-base leading-relaxed text-ink-secondary lg:mt-6 lg:max-w-[36rem] lg:text-lg xl:max-w-[42rem] xl:text-xl">
            {hero.subtitle}
          </p>
          <div className="mt-6 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center lg:mt-8">
            <PrimaryCta className="w-full sm:w-auto">{hero.cta}</PrimaryCta>
          </div>

          <div className="-mx-6 mt-10 lg:hidden">
            <HeroRows />
          </div>
        </div>
      </div>
    </section>
  );
}
