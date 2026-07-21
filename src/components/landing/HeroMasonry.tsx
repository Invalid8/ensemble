import { cn } from "@/lib/utils";
import { Marquee } from "@/components/landing/Marquee";
import { heroColumns, heroRows } from "@/lib/landing/images";

const COLUMN_CONFIG = [
  { reverse: false, duration: 48, delay: 0 },
  { reverse: true, duration: 56, delay: -6 },
  { reverse: false, duration: 52, delay: -12 },
];

const ROW_CONFIG = [
  { reverse: false, duration: 40, delay: 0 },
  { reverse: true, duration: 46, delay: -5 },
  { reverse: false, duration: 43, delay: -9 },
];

export function HeroColumns({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full gap-4", className)}>
      {heroColumns.map((images, i) => (
        <Marquee
          key={i}
          images={images}
          orientation="vertical"
          reverse={COLUMN_CONFIG[i].reverse}
          durationSeconds={COLUMN_CONFIG[i].duration}
          delaySeconds={COLUMN_CONFIG[i].delay}
          className="h-full flex-1"
        />
      ))}
    </div>
  );
}

export function HeroRows({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {heroRows.map((images, i) => (
        <Marquee
          key={i}
          images={images}
          orientation="horizontal"
          reverse={ROW_CONFIG[i].reverse}
          durationSeconds={ROW_CONFIG[i].duration}
          delaySeconds={ROW_CONFIG[i].delay}
          itemClassName="h-28 w-36"
        />
      ))}
    </div>
  );
}
