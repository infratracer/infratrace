import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDecisions } from "../api/decisions";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import { formatDate, formatCurrency, truncateHash } from "../utils/format";
import { decisionTypeBadgeVariant, decisionTypeLabel, riskBadgeVariant } from "../utils/risk";
import type { Decision } from "../types";
import { DECISION_TYPES } from "../utils/constants";
import { Inbox } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";

export default function TimelinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getDecisions(id, filter ? { decision_type: filter } : undefined);
        setDecisions(data);
      } catch (err) {
        console.error("Failed to load decisions:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={32} className="text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
            !filter ? "bg-accent text-white" : "border border-glass-border"
          }`}
          style={{ color: filter ? "var(--text-secondary)" : undefined }}
        >
          All
        </button>
        {DECISION_TYPES.map((dt) => (
          <button
            key={dt.value}
            onClick={() => setFilter(dt.value)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
              filter === dt.value ? "bg-accent text-white" : "border border-glass-border"
            }`}
            style={{ color: filter === dt.value ? undefined : "var(--text-secondary)" }}
          >
            {dt.label}
          </button>
        ))}
      </div>

      {/* Decision list */}
      {decisions.length === 0 ? (
        <EmptyState icon={Inbox} title="No decisions found" description="No decisions match the current filter." />
      ) : (
        <div className="space-y-3">
          {decisions.map((d, i) => (
            <GlassCard
              key={d.id}
              hover
              onClick={() => navigate(`/project/${id}/decision/${d.id}`)}
              padding="md"
            >
              <div className="flex items-start gap-4">
                {/* Sequence number */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-mono font-bold"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--color-glass-border)",
                    }}
                  >
                    {d.sequence_number}
                  </div>
                  {i < decisions.length - 1 && (
                    <div className="w-px h-6 mt-1" style={{ backgroundColor: "var(--color-glass-border)" }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant={decisionTypeBadgeVariant(d.decision_type)}>
                      {decisionTypeLabel(d.decision_type)}
                    </Badge>
                    <Badge variant={riskBadgeVariant(d.risk_level)}>{d.risk_level}</Badge>
                    {d.blockchain_tx && (
                      <Badge variant="chain-verified">On-chain</Badge>
                    )}
                    {d.sensor_trigger_id && (
                      <Badge variant="iot-triggered">IoT Triggered</Badge>
                    )}
                  </div>

                  <h3
                    className="text-[15px] font-semibold mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {d.title}
                  </h3>
                  <p className="text-[12px] line-clamp-2 mb-2" style={{ color: "var(--text-secondary)" }}>
                    {d.description}
                  </p>

                  <div className="flex items-center gap-4 text-[10px]" style={{ color: "var(--text-muted)" }}>
                    <span>{formatDate(d.created_at)}</span>
                    {d.cost_impact !== 0 && (
                      <span style={{ color: d.cost_impact > 0 ? "#FF3366" : "#00FF88" }}>
                        {d.cost_impact > 0 ? "+" : ""}{formatCurrency(d.cost_impact)}
                      </span>
                    )}
                    <span className="font-mono">{truncateHash(d.hash, 6)}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
