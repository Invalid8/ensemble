"use client";

import { useEffect, useRef, useState } from "react";
import { Bloom } from "@/components/brand/Bloom";

const BLOOMS = [
  {
    className: "-left-56 top-[2%]",
    size: 460,
    opacity: "opacity-[0.09]",
    startX: -34,
    endX: 58,
    startY: -90,
    endY: 180,
    startRotate: -32,
    endRotate: 74,
    colors: ["var(--color-petal-1)", "var(--color-petal-2)", "var(--color-petal-3)"],
  },
  {
    className: "-right-64 top-[34%]",
    size: 540,
    opacity: "opacity-[0.10]",
    startX: 70,
    endX: -62,
    startY: 170,
    endY: -160,
    startRotate: 44,
    endRotate: -82,
    colors: ["var(--color-petal-2)", "var(--color-petal-3)", "var(--color-accent)"],
  },
  {
    className: "-left-60 bottom-[-2%]",
    size: 520,
    opacity: "opacity-[0.08]",
    startX: -52,
    endX: 80,
    startY: 160,
    endY: -190,
    startRotate: -70,
    endRotate: 48,
    colors: ["var(--color-petal-3)", "var(--color-petal-1)", "var(--color-accent)"],
  },
  {
    className: "right-[8%] top-[8%]",
    size: 180,
    opacity: "opacity-[0.08]",
    startX: 24,
    endX: -84,
    startY: -40,
    endY: 130,
    startRotate: 10,
    endRotate: 150,
    colors: ["var(--color-petal-1)", "var(--color-petal-3)"],
  },
  {
    className: "left-[12%] bottom-[18%]",
    size: 220,
    opacity: "opacity-[0.07]",
    startX: -40,
    endX: 76,
    startY: 90,
    endY: -80,
    startRotate: -120,
    endRotate: 28,
    colors: ["var(--color-petal-2)", "var(--color-accent)"],
  },
];

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

export function FeatureParallaxBlooms() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el || reduceMotion) return;

      const rect = (el.parentElement ?? el).getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const nextProgress = clamp((viewportHeight - rect.top) / (rect.height + viewportHeight));
      setProgress(nextProgress);
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden lg:block"
      aria-hidden
    >
      {BLOOMS.map((bloom, index) => {
        const x = bloom.startX + (bloom.endX - bloom.startX) * progress;
        const y = bloom.startY + (bloom.endY - bloom.startY) * progress;
        const rotate = bloom.startRotate + (bloom.endRotate - bloom.startRotate) * progress;
        const scale = 0.94 + progress * 0.12;

        return (
          <div
            key={index}
            className={`absolute ${bloom.className} ${bloom.opacity}`}
            style={{
              transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`,
            }}
          >
            <Bloom
              size={bloom.size}
              petalColors={bloom.colors}
              heartColor="var(--color-gold)"
            />
          </div>
        );
      })}
    </div>
  );
}
