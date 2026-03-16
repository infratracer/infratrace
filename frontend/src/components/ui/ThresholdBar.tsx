import { useTheme } from "../../hooks/useTheme";

interface ThresholdBarProps {
  value: number;
  threshold: number;
  className?: string;
}

export default function ThresholdBar({ value, threshold, className = "" }: ThresholdBarProps) {
  const t = useTheme();
  const pct = Math.min((value / threshold) * 100, 100);
  const ratio = value / threshold;

  let color: string;
  let glow: string;

  if (ratio < 0.85) {
    color = t.neonGreen;
    glow = "none";
  } else if (ratio <= 1) {
    color = t.neonAmber;
    glow = "none";
  } else {
    color = t.neonRed;
    glow = `0 0 6px ${t.neonRedDim}`;
  }

  return (
    <div className={`w-full h-[3px] rounded-full ${className}`} style={{ backgroundColor: t.divider }}>
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
