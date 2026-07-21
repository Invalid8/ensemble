import Link from "next/link";
import { cn } from "@/lib/utils";

interface PrimaryCtaProps {
  children: React.ReactNode;
  href?: string;
  className?: string;
}

export function PrimaryCta({ children, href = "/get-ready", className }: PrimaryCtaProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-accent px-8 py-4",
        "font-body text-base font-semibold text-ink",
        "shadow-[0_14px_36px_rgba(26,26,26,0.10)] transition-transform hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </Link>
  );
}
