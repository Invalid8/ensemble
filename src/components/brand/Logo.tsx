import { cn } from "@/lib/utils";
import { Bloom } from "@/components/brand/Bloom";

interface LogoProps {
  size?: number;
  className?: string;
  bloomClassName?: string;
  wordClassName?: string;
  showSecondaryBloom?: boolean;
}

export function Logo({
  size = 30,
  className,
  bloomClassName,
  wordClassName,
  showSecondaryBloom = false,
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 leading-none", className)}>
      <Bloom
        size={size}
        className={cn("shrink-0 -translate-y-[8%]", bloomClassName)}
      />
      <h4
        className={cn(
          "m-0 block p-0 font-heading text-2xl leading-[0.88] text-ink",
          wordClassName,
        )}
      >
        Ensemble
      </h4>
      {showSecondaryBloom && (
        <Bloom
          size={size}
          className={cn("shrink-0 -translate-y-[8%]", bloomClassName)}
        />
      )}
    </div>
  );
}
