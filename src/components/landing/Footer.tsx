import { footer } from "@/lib/landing/content";
import { Logo } from "../brand/Logo";

export function Footer() {
  return (
    <footer className="overflow-hidden">
      <nav className="w-full border-t-0 border-border-subtle px-6 pb-6 pt-18 lg:px-20 lg:pt-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="font-body text-[11px] text-ink-muted">
            {footer.disclaimer}
          </p>
          <p className="font-body text-[11px] text-ink-muted">
            {footer.credit}
          </p>
        </div>
      </nav>
      <div className="flex flex-1 items-center justify-center pb-8 pt-1">
        <Logo
          size={64}
          className="gap-3 sm:gap-5 lg:gap-[clamp(1rem,1.8vw,2rem)]"
          bloomClassName="h-14 w-14 sm:h-20 sm:w-20 lg:h-[clamp(6.5rem,9vw,10.5rem)] lg:w-[clamp(6.5rem,9vw,10.5rem)]"
          wordClassName="text-[56px] uppercase leading-none sm:text-[92px] lg:text-[clamp(8rem,14vw,14rem)]"
          showSecondaryBloom
        />
      </div>
    </footer>
  );
}
