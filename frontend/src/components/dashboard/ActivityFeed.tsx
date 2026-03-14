import GlassCard from "../ui/GlassCard";
import Badge from "../ui/Badge";
import { formatRelative } from "../../utils/format";
import { decisionTypeBadgeVariant, decisionTypeLabel } from "../../utils/risk";
import type { Decision } from "../../types";

interface ActivityFeedProps {
  decisions: Decision[];
}

export default function ActivityFeed({ decisions }: ActivityFeedProps) {
  const recent = decisions.slice(0, 8);

  return (
    <div className="space-y-3">
      <h2
        className="text-[9px] uppercase tracking-widest font-semibold"
        style={{ color: "var(--text-muted)" }}
      >
        Recent Activity
      </h2>
      <GlassCard padding="sm">
        <div className="divide-y" style={{ borderColor: "var(--color-divider)" }}>
          {recent.map((d) => (
            <div key={d.id} className="flex items-center gap-3 py-2.5 px-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0"
                style={{
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-secondary)",
                }}
              >
                #{d.sequence_number}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[12px] font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {d.title}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {formatRelative(d.created_at)}
                </p>
              </div>
              <Badge variant={decisionTypeBadgeVariant(d.decision_type)}>
                {decisionTypeLabel(d.decision_type)}
              </Badge>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
