import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDecision } from "../api/decisions";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import { formatDate, formatCurrency, truncateHash } from "../utils/format";
import { decisionTypeBadgeVariant, decisionTypeLabel, riskBadgeVariant } from "../utils/risk";
import { env } from "../config/env";
import { ArrowLeft, ExternalLink, Link2, Shield, AlertTriangle } from "lucide-react";
import type { Decision } from "../types";

export default function DecisionDetailPage() {
  const { id, did } = useParams<{ id: string; did: string }>();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !did) return;
    (async () => {
      try {
        const data = await getDecision(id, did);
        setDecision(data);
      } catch (err) {
        console.error("Failed to load decision:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, did]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={32} className="text-accent" />
      </div>
    );
  }

  if (!decision) {
    return <p style={{ color: "var(--text-secondary)" }}>Decision not found.</p>;
  }

  const d = decision;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Back link */}
      <Link
        to={`/project/${id}/timeline`}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-accent hover:underline"
      >
        <ArrowLeft size={14} /> Back to Timeline
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
              #{d.sequence_number}
            </span>
            <Badge variant={decisionTypeBadgeVariant(d.decision_type)}>
              {decisionTypeLabel(d.decision_type)}
            </Badge>
            <Badge variant={riskBadgeVariant(d.risk_level)}>{d.risk_level}</Badge>
          </div>
          <h1 className="text-[20px] font-bold" style={{ color: "var(--text-primary)" }}>
            {d.title}
          </h1>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
            {formatDate(d.created_at)} &middot; Approved by {d.approved_by}
          </p>
        </div>
        {d.cost_impact !== 0 && (
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>
              Cost Impact
            </p>
            <p
              className="text-[24px] font-bold"
              style={{ color: d.cost_impact > 0 ? "#FF3366" : "#00FF88" }}
            >
              {d.cost_impact > 0 ? "+" : ""}{formatCurrency(d.cost_impact)}
            </p>
          </div>
        )}
      </div>

      {/* Description & Justification */}
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard padding="md">
          <h3 className="text-[9px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
            Description
          </h3>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {d.description}
          </p>
        </GlassCard>
        <GlassCard padding="md">
          <h3 className="text-[9px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
            Justification
          </h3>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {d.justification}
          </p>
        </GlassCard>
      </div>

      {/* Hash Chain Position */}
      <GlassCard padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Link2 size={16} className="text-accent" />
          <h3 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Chain Position
          </h3>
        </div>
        <div className="space-y-2 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--text-muted)" }}>Previous:</span>
            <span style={{ color: "var(--text-secondary)" }}>{truncateHash(d.previous_hash, 12)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--text-muted)" }}>Current:</span>
            <span className="text-neon-green">{truncateHash(d.hash, 12)}</span>
          </div>
        </div>
      </GlassCard>

      {/* Blockchain Proof */}
      <GlassCard padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-accent" />
          <h3 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Blockchain Proof
          </h3>
        </div>
        {d.blockchain_tx ? (
          <div className="space-y-2">
            <Badge variant="chain-verified">Anchored On-Chain</Badge>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-mono" style={{ color: "var(--text-secondary)" }}>
                {truncateHash(d.blockchain_tx, 10)}
              </span>
              {env.POLYGONSCAN_URL && (
                <a
                  href={`${env.POLYGONSCAN_URL}/tx/${d.blockchain_tx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline inline-flex items-center gap-1 text-[11px]"
                >
                  View <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant={d.blockchain_status === "pending" ? "chain-pending" : "chain-failed"}>
              {d.blockchain_status}
            </Badge>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {d.blockchain_status === "pending" ? "Waiting for confirmation..." : "Anchoring failed"}
            </span>
          </div>
        )}
      </GlassCard>

      {/* Sensor Trigger */}
      {d.sensor_trigger_id && (
        <GlassCard padding="md" glow="amber">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-neon-amber" />
            <h3 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
              IoT Sensor Triggered
            </h3>
          </div>
          <p className="text-[12px] mt-2" style={{ color: "var(--text-secondary)" }}>
            This decision was triggered by a sensor anomaly.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
