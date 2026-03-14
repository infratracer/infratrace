import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDecision } from "../api/decisions";
import { formatDate, formatCurrency, truncateHash } from "../utils/format";
import { decisionTypeLabel, riskColor } from "../utils/risk";
import { env } from "../config/env";
import type { Decision } from "../types";
import { useTheme } from "../hooks/useTheme";

export default function DecisionDetailPage() {
  const { id, did } = useParams<{ id: string; did: string }>();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTheme();

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

  const glassCard: React.CSSProperties = {
    background: t.bgCard,
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 18,
    boxShadow: `${t.glassShadow}, ${t.glassInnerGlow}`,
    padding: "20px",
  };

  const overline: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: t.textMuted,
  };

  const badge = (bg: string, color: string): React.CSSProperties => ({
    display: "inline-block",
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 9999,
    background: bg,
    color,
    lineHeight: "18px",
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: `3px solid ${t.accentDim}`,
            borderTopColor: t.accent,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!decision) {
    return <p style={{ color: t.textSecondary }}>Decision not found.</p>;
  }

  const d = decision;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 896 }}>
      {/* Back link */}
      <Link
        to={`/project/${id}/timeline`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 500,
          color: t.accent,
          textDecoration: "none",
        }}
      >
        {"←"} Back to Timeline
      </Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontFamily: "monospace", color: t.textMuted }}>
              #{d.sequence_number}
            </span>
            <span style={badge(t.accentDim, t.accent)}>
              {decisionTypeLabel(d.decision_type)}
            </span>
            <span
              style={badge(
                d.risk_level === "low" ? t.neonGreenDim :
                d.risk_level === "medium" ? t.neonAmberDim : t.neonRedDim,
                riskColor(d.risk_level)
              )}
            >
              {d.risk_level}
            </span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: t.textPrimary, margin: 0 }}>
            {d.title}
          </h1>
          <p style={{ fontSize: 11, marginTop: 4, color: t.textMuted }}>
            {formatDate(d.created_at)} &middot; Approved by {d.approved_by}
          </p>
        </div>
        {d.cost_impact !== 0 && (
          <div style={{ textAlign: "right" }}>
            <p style={{ ...overline, marginBottom: 4 }}>Cost Impact</p>
            <p
              style={{
                fontSize: 24,
                fontWeight: 700,
                margin: 0,
                color: d.cost_impact > 0 ? t.neonRed : t.neonGreen,
              }}
            >
              {d.cost_impact > 0 ? "+" : ""}{formatCurrency(d.cost_impact)}
            </p>
          </div>
        )}
      </div>

      {/* Description & Justification */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <div style={glassCard}>
          <h3 style={{ ...overline, marginBottom: 8 }}>Description</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: t.textSecondary, margin: 0 }}>
            {d.description}
          </p>
        </div>
        <div style={glassCard}>
          <h3 style={{ ...overline, marginBottom: 8 }}>Justification</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: t.textSecondary, margin: 0 }}>
            {d.justification}
          </p>
        </div>
      </div>

      {/* Hash Chain Position */}
      <div style={glassCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>{"⛓"}</span>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, margin: 0 }}>
            Chain Position
          </h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: "monospace", fontSize: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: t.textMuted }}>Previous:</span>
            <span style={{ color: t.textSecondary }}>{truncateHash(d.previous_hash, 12)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: t.textMuted }}>Current:</span>
            <span style={{ color: t.neonGreen }}>{truncateHash(d.hash, 12)}</span>
          </div>
        </div>
      </div>

      {/* Blockchain Proof */}
      <div style={glassCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>{"🛡"}</span>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, margin: 0 }}>
            Blockchain Proof
          </h3>
        </div>
        {d.blockchain_tx ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={badge(t.tealDim, t.teal)}>Anchored On-Chain</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: t.textSecondary }}>
                {truncateHash(d.blockchain_tx, 10)}
              </span>
              {env.POLYGONSCAN_URL && (
                <a
                  href={`${env.POLYGONSCAN_URL}/tx/${d.blockchain_tx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: t.accent,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    textDecoration: "none",
                  }}
                >
                  View {"↗"}
                </a>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={badge(
                d.blockchain_status === "pending" ? t.neonAmberDim : t.neonRedDim,
                d.blockchain_status === "pending" ? t.neonAmber : t.neonRed
              )}
            >
              {d.blockchain_status}
            </span>
            <span style={{ fontSize: 11, color: t.textMuted }}>
              {d.blockchain_status === "pending" ? "Waiting for confirmation..." : "Anchoring failed"}
            </span>
          </div>
        )}
      </div>

      {/* Sensor Trigger */}
      {d.sensor_trigger_id && (
        <div
          style={{
            ...glassCard,
            border: `1px solid ${t.neonAmberDim}`,
            boxShadow: `${t.glassShadow}, ${t.glassInnerGlow}, 0 0 20px ${t.neonAmberDim}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, color: t.neonAmber }}>{"⚠"}</span>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, margin: 0 }}>
              IoT Sensor Triggered
            </h3>
          </div>
          <p style={{ fontSize: 12, marginTop: 8, color: t.textSecondary }}>
            This decision was triggered by a sensor anomaly.
          </p>
        </div>
      )}
    </div>
  );
}
