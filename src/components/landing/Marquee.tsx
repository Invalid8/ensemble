"use client";

import { cn } from "@/lib/utils";
import type { MarqueeImage } from "@/lib/landing/images";

interface MarqueeProps {
  images: MarqueeImage[];
  orientation: "vertical" | "horizontal";
  reverse?: boolean;
  durationSeconds?: number;
  delaySeconds?: number;
  className?: string;
  itemClassName?: string;
}

export function Marquee({
  images,
  orientation,
  reverse = false,
  durationSeconds = 44,
  delaySeconds = 0,
  className,
  itemClassName,
}: MarqueeProps) {
  const vertical = orientation === "vertical";
  const copiesPerSet = vertical ? 1 : 4;
  const set = Array.from({ length: copiesPerSet }, () => images).flat();
  const loop = [...set, ...set];

  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        className={cn(
          "marquee-track flex",
          vertical ? "flex-col gap-4" : "w-max flex-row gap-3",
        )}
        style={{
          animationName: vertical ? "marquee-y" : "marquee-x",
          animationDuration: `${durationSeconds}s`,
          animationDelay: `${delaySeconds}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {loop.map((image, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={image.src}
            alt=""
            aria-hidden
            width={image.width}
            height={image.height}
            loading="lazy"
            fetchPriority={i === 0 ? "high" : "auto"}
            decoding="async"
            className={cn(
              "rounded-2xl object-cover shadow-[0_6px_18px_rgba(26,26,26,0.08)]",
              vertical ? "h-auto w-full" : "",
              itemClassName
            )}
          />
        ))}
      </div>
    </div>
  );
}
