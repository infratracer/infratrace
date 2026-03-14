import { DollarSign, TrendingUp, AlertTriangle, Shield } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import { formatCurrency } from "../../utils/format";
import type { Project } from "../../types";

interface MetricsRowProps {
  projects: Project[];
  anomalyCount: number;
  decisionCount: number;
}

export default function MetricsRow({ projects, anomalyCount, decisionCount }: MetricsRowProps) {
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const drift = totalBudget > 0 ? ((totalSpent - totalBudget) / totalBudget) * 100 : 0;

  const metrics = [
    {
      label: "Total Budget",
      value: formatCurrency(totalBudget),
      icon: DollarSign,
      color: "#4A9EFF",
    },
    {
      label: "Budget Drift",
      value: `${drift >= 0 ? "+" : ""}${drift.toFixed(1)}%`,
      icon: TrendingUp,
      color: drift > 10 ? "#FF3366" : drift > 5 ? "#FFB800" : "#00FF88",
    },
    {
      label: "Active Anomalies",
      value: anomalyCount.toString(),
      icon: AlertTriangle,
      color: anomalyCount > 0 ? "#FF3366" : "#00FF88",
    },
    {
      label: "Total Decisions",
      value: decisionCount.toString(),
      icon: Shield,
      color: "#4A9EFF",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <GlassCard key={m.label} padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p
                className="text-[9px] uppercase tracking-widest font-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                {m.label}
              </p>
              <p className="text-[30px] font-bold leading-none" style={{ color: m.color }}>
                {m.value}
              </p>
            </div>
            <m.icon size={18} style={{ color: m.color, opacity: 0.5 }} />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
