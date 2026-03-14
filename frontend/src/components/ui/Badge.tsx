type BadgeVariant =
  | "risk-low" | "risk-medium" | "risk-high" | "risk-critical"
  | "type-scope" | "type-cost" | "type-assumption" | "type-contractor"
  | "type-schedule" | "type-risk" | "type-approval"
  | "sensor-normal" | "sensor-warning" | "sensor-anomaly"
  | "chain-verified" | "chain-pending" | "chain-failed"
  | "ai-flagged" | "iot-triggered"
  | "severity-info" | "severity-warning" | "severity-critical"
  | "default";

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  "risk-low": { bg: "bg-neon-green-dim", color: "text-neon-green" },
  "risk-medium": { bg: "bg-neon-amber-dim", color: "text-neon-amber" },
  "risk-high": { bg: "bg-neon-red-dim", color: "text-neon-red" },
  "risk-critical": { bg: "bg-neon-red-dim", color: "text-neon-red" },
  "type-scope": { bg: "bg-accent-dim", color: "text-accent" },
  "type-cost": { bg: "bg-neon-red-dim", color: "text-neon-red" },
  "type-assumption": { bg: "bg-neon-amber-dim", color: "text-neon-amber" },
  "type-contractor": { bg: "bg-teal-dim", color: "text-teal" },
  "type-schedule": { bg: "bg-neon-amber-dim", color: "text-neon-amber" },
  "type-risk": { bg: "bg-neon-amber-dim", color: "text-neon-amber" },
  "type-approval": { bg: "bg-neon-green-dim", color: "text-neon-green" },
  "sensor-normal": { bg: "bg-neon-green-dim", color: "text-neon-green" },
  "sensor-warning": { bg: "bg-neon-amber-dim", color: "text-neon-amber" },
  "sensor-anomaly": { bg: "bg-neon-red-dim", color: "text-neon-red" },
  "chain-verified": { bg: "bg-neon-green-dim", color: "text-neon-green" },
  "chain-pending": { bg: "bg-accent-dim", color: "text-accent" },
  "chain-failed": { bg: "bg-neon-red-dim", color: "text-neon-red" },
  "ai-flagged": { bg: "bg-neon-amber-dim", color: "text-neon-amber" },
  "iot-triggered": { bg: "bg-teal-dim", color: "text-teal" },
  "severity-info": { bg: "bg-accent-dim", color: "text-accent" },
  "severity-warning": { bg: "bg-neon-amber-dim", color: "text-neon-amber" },
  "severity-critical": { bg: "bg-neon-red-dim", color: "text-neon-red" },
  default: { bg: "bg-accent-dim", color: "text-accent" },
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  const { bg, color } = variantStyles[variant];
  return (
    <span
      className={`inline-flex items-center px-2 py-[3px] rounded-[6px] text-[9px] font-semibold uppercase tracking-wide ${bg} ${color} ${className}`}
    >
      {children}
    </span>
  );
}
