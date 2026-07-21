"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { PrimaryCta } from "@/components/landing/PrimaryCta";
import { hero } from "@/lib/landing/content";

const SHOW_AFTER = 70;

export function ScrollNav() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <div className="flex items-center justify-between border-b-0 border-border-subtle bg-bg/85 px-6 py-4 backdrop-blur-md lg:px-20">
        <Logo size={26} wordClassName="text-xl" />
        <PrimaryCta className="px-5 py-2.5 text-sm">{hero.cta}</PrimaryCta>
      </div>
    </div>
  );
}
