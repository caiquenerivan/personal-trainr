const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type DonutProgressProps = {
  percentage: number;
  color?: string;
  size?: number;
};

export function DonutProgress({ percentage, color = '#AF9150', size = 96 }: DonutProgressProps) {
  const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 80 80"
        fill="none"
        className="h-full w-full -rotate-90"
      >
        <circle
          cx="40"
          cy="40"
          r={RADIUS}
          stroke="#333333"
          strokeWidth="7"
        />
        <circle
          cx="40"
          cy="40"
          r={RADIUS}
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-number text-lg font-bold text-white"
      >
        {percentage}%
      </span>
    </div>
  );
}
