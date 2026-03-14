interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
}

function getBarColor(pct: number): string {
  if (pct < 50) return "#00FF88";
  if (pct < 85) return "#FFB800";
  return "#FF3366";
}

function getGlow(pct: number): string {
  if (pct < 50) return "0 0 6px rgba(0,255,136,0.4)";
  if (pct < 85) return "0 0 6px rgba(255,184,0,0.4)";
  return "0 0 6px rgba(255,51,102,0.4)";
}

export default function ProgressBar({ value, max = 100, className = "" }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const color = getBarColor(pct);

  return (
    <div className={`w-full h-[3px] rounded-full ${className}`} style={{ backgroundColor: "var(--color-divider)" }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          backgroundColor: color,
          boxShadow: getGlow(pct),
        }}
      />
    </div>
  );
}
