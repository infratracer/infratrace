interface ThresholdBarProps {
  value: number;
  threshold: number;
  className?: string;
}

export default function ThresholdBar({ value, threshold, className = "" }: ThresholdBarProps) {
  const pct = Math.min((value / threshold) * 100, 100);
  const ratio = value / threshold;

  let color: string;
  let glow: string;

  if (ratio < 0.85) {
    color = "#00FF88";
    glow = "none";
  } else if (ratio <= 1) {
    color = "#FFB800";
    glow = "none";
  } else {
    color = "#FF3366";
    glow = "0 0 6px rgba(255,51,102,0.4)";
  }

  return (
    <div className={`w-full h-[3px] rounded-full ${className}`} style={{ backgroundColor: "var(--color-divider)" }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          backgroundColor: color,
          boxShadow: glow,
        }}
      />
    </div>
  );
}
