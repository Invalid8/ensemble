const PETAL_PATH =
  "M 94.5 78 C 82 65 79 41 86.5 15 Q 90.5 12 94.5 14 Q 100 22 105.5 14 Q 109.5 12 113.5 15 C 121 41 118 65 105.5 78 Q 100 82.5 94.5 78 Z";

const ASPECT = 71 / 46;

interface PetalProps {
  width?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Petal({
  width = 24,
  color = "var(--color-petal-1)",
  className,
  style,
}: PetalProps) {
  return (
    <svg
      width={width}
      height={width * ASPECT}
      viewBox="77 10 46 71"
      className={className}
      style={style}
      aria-hidden
    >
      <path d={PETAL_PATH} fill={color} />
    </svg>
  );
}
