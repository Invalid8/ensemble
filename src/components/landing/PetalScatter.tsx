import { Petal } from "@/components/brand/Petal";

interface ScatterPetal {
  top: string;
  left?: string;
  right?: string;
  width: number;
  rotate: number;
  tone: string;
}

const PETALS: ScatterPetal[] = [
  { top: "9%", left: "2.5%", width: 24, rotate: 150, tone: "petal-2" },
  { top: "16%", right: "3%", width: 22, rotate: -42, tone: "petal-1" },
  { top: "23%", left: "12%", width: 18, rotate: 74, tone: "petal-3" },
  { top: "32%", left: "3%", width: 20, rotate: 120, tone: "petal-3" },
  { top: "39%", right: "13%", width: 18, rotate: -92, tone: "petal-2" },
  { top: "48%", right: "2.5%", width: 24, rotate: -140, tone: "petal-2" },
  { top: "56%", left: "15%", width: 19, rotate: 34, tone: "petal-1" },
  { top: "66%", left: "3%", width: 22, rotate: 160, tone: "petal-1" },
  { top: "73%", right: "14%", width: 18, rotate: -18, tone: "petal-3" },
  { top: "82%", right: "3%", width: 20, rotate: -30, tone: "petal-3" },
  { top: "90%", left: "10%", width: 18, rotate: 104, tone: "petal-2" },
];

export function PetalScatter() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block" aria-hidden>
      {PETALS.map((p, i) => (
        <Petal
          key={i}
          width={p.width}
          color={`var(--color-${p.tone})`}
          className="absolute"
          style={{
            top: p.top,
            left: p.left,
            right: p.right,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
