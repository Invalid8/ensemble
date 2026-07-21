const PETAL_COUNT = 7;

function petalPath(angleDeg: number): string {
  const t = (angleDeg * Math.PI) / 180;
  const ct = Math.cos(t);
  const st = Math.sin(t);
  const point = (x: number, y: number) =>
    `${(100 + x * ct - y * st).toFixed(2)} ${(100 + x * st + y * ct).toFixed(2)}`;
  return [
    `M ${point(26, -5.5)}`,
    `C ${point(48, -18)} ${point(72, -21)} ${point(85, -13.5)}`,
    `Q ${point(88, -9.5)} ${point(86, -5.5)}`,
    `Q ${point(78, 0)} ${point(86, 5.5)}`,
    `Q ${point(88, 9.5)} ${point(85, 13.5)}`,
    `C ${point(72, 21)} ${point(48, 18)} ${point(26, 5.5)}`,
    `Q ${point(21.5, 0)} ${point(26, -5.5)}`,
    "Z",
  ].join(" ");
}

const petals = Array.from({ length: PETAL_COUNT }, (_, i) =>
  petalPath((i * 360) / PETAL_COUNT - 90)
);

interface BloomProps {
  size?: number;
  petalColors?: string[];
  heartColor?: string;
  className?: string;
}

export function Bloom({
  size = 64,
  petalColors = ["var(--color-petal-1)", "var(--color-petal-2)"],
  heartColor = "var(--color-gold)",
  className,
}: BloomProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      aria-hidden
    >
      {petals.map((d, i) => (
        <path key={i} d={d} fill={petalColors[i % petalColors.length]} />
      ))}
      <circle cx="100" cy="100" r="16" fill={heartColor} />
    </svg>
  );
}
