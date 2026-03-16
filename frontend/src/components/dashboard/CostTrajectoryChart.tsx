import { useMemo } from "react";
import type { Decision } from "../../types";
import { formatCurrency } from "../../utils/format";

interface CostTrajectoryChartProps {
  decisions: Decision[];
  budget: number;
}

export default function CostTrajectoryChart({ decisions, budget }: CostTrajectoryChartProps) {
  const data = useMemo(() => {
    let cumulative = 0;
    return decisions
      .sort((a, b) => a.sequence_number - b.sequence_number)
      .map((d) => {
        cumulative += d.cost_impact ?? 0;
        return { seq: d.sequence_number, cost: cumulative, title: d.title, impact: d.cost_impact ?? 0 };
      });
  }, [decisions]);

  if (data.length === 0) return null;

  const maxCost = Math.max(...data.map((d) => d.cost), budget) * 1.1;
  const width = 600;
  const height = 200;
  const padL = 60;
  const padR = 20;
  const padT = 20;
  const padB = 30;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const scaleX = (i: number) => padL + (i / (data.length - 1 || 1)) * chartW;
  const scaleY = (v: number) => padT + chartH - (v / maxCost) * chartH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(d.cost)}`).join(" ");
  const areaPath = `${linePath} L ${scaleX(data.length - 1)} ${scaleY(0)} L ${scaleX(0)} ${scaleY(0)} Z`;
  const budgetY = scaleY(budget);

  return (
    <div className="space-y-3">
      <h2
        className="text-[9px] uppercase tracking-widest font-semibold"
        style={{ color: "var(--text-muted)" }}
      >
        Cost Trajectory
      </h2>
      <div className="glass-card p-4 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 400 }}>
          <defs>
            <linearGradient id="costLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00FF88" />
              <stop offset="50%" stopColor="#FFB800" />
              <stop offset="100%" stopColor="#FF3366" />
            </linearGradient>
            <linearGradient id="costArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF3366" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FF3366" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <line
              key={pct}
              x1={padL}
              x2={width - padR}
              y1={padT + chartH * (1 - pct)}
              y2={padT + chartH * (1 - pct)}
              stroke="var(--color-chart-grid)"
              strokeWidth={1}
            />
          ))}

          {/* Budget line */}
          <line
            x1={padL}
            x2={width - padR}
            y1={budgetY}
            y2={budgetY}
            stroke="var(--text-muted)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <text x={padL - 4} y={budgetY + 3} textAnchor="end" fill="var(--text-muted)" fontSize={9}>
            Budget
          </text>

          {/* Area fill */}
          <path d={areaPath} fill="url(#costArea)" />

          {/* Line */}
          <path d={linePath} fill="none" stroke="url(#costLine)" strokeWidth={2} strokeLinecap="round" />

          {/* Data points */}
          {data.map((d, i) => (
            <g key={i}>
              <circle
                cx={scaleX(i)}
                cy={scaleY(d.cost)}
                r={4}
                fill={d.cost > budget ? "#FF3366" : d.cost > budget * 0.8 ? "#FFB800" : "#00FF88"}
                style={{ filter: `drop-shadow(0 0 4px ${d.cost > budget ? "#FF336680" : "#00FF8880"})` }}
              />
              <title>{`#${d.seq}: ${d.title}\n${formatCurrency(d.impact)} → Total: ${formatCurrency(d.cost)}`}</title>
            </g>
          ))}

          {/* Y-axis labels */}
          {[0, 0.5, 1].map((pct) => (
            <text
              key={pct}
              x={padL - 6}
              y={padT + chartH * (1 - pct) + 3}
              textAnchor="end"
              fill="var(--text-muted)"
              fontSize={9}
              fontFamily="var(--font-mono)"
            >
              {formatCurrency(maxCost * pct)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
