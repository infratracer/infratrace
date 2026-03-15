import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDecisions } from "../api/decisions";
import { formatDate, formatCurrency, truncateHash } from "../utils/format";
import { decisionTypeLabel, riskColor } from "../utils/risk";
import type { Decision } from "../types";
import { DECISION_TYPES } from "../utils/constants";
import { useTheme } from "../hooks/useTheme";

export default function TimelinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");
  const t = useTheme();
  const abortRef = useRef<AbortController>();

  const loadData = async () => {
    if (!id) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setLoading(true);
    try {
      const data = await getDecisions(id, filter ? { decision_type: filter } : undefined);
      if (controller.signal.aborted) return;
      setDecisions(data);
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
      console.error("Failed to load decisions:", err);
      setError("Failed to load timeline. Please try again.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => abortRef.current?.abort();
  }, [id, filter]);

  const glassCard: React.CSSProperties = {
    background: t.bgCard,
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 16,
    boxShadow: `${t.glassShadow}, ${t.glassInnerGlow}`,
    padding: "20px",
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
        <div style={{
          width: 32, height: 32,
          border: `3px solid ${t.accentDim}`,
          borderTopColor: t.accent,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 256 }}>
        <div style={{ ...glassCard, maxWidth: 420, width: "100%", textAlign: "center", padding: "40px 32px" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>!</div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, marginBottom: 8 }}>Failed to Load Timeline</h3>
          <p style={{ fontSize: 12, color: t.textSecondary, marginBottom: 20 }}>{error}</p>
          <button onClick={loadData} style={{
            padding: "10px 24px", background: t.accent, border: "none", borderRadius: 10,
            color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: t.btnShadow,
          }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filter bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          onClick={() => setFilter("")}
          style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 500,
            cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
            background: !filter ? t.accent : "transparent",
            color: !filter ? "#fff" : t.textSecondary,
            border: !filter ? "none" : `1px solid ${t.glassBorder}`,
          }}
        >All</button>
        {DECISION_TYPES.map((dt) => (
          <button
            key={dt.value}
            onClick={() => setFilter(dt.value)}
            style={{
              padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 500,
              cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
              background: filter === dt.value ? t.accent : "transparent",
              color: filter === dt.value ? "#fff" : t.textSecondary,
              border: filter === dt.value ? "none" : `1px solid ${t.glassBorder}`,
            }}
          >{dt.label}</button>
        ))}
      </div>

      {/* Decision list */}
      {decisions.length === 0 ? (
        <div style={{
          ...glassCard,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: 48, gap: 12,
        }}>
          <span style={{ fontSize: 32 }}>{"\u{1F4ED}"}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.textPrimary }}>No decisions found</span>
          <span style={{ fontSize: 12, color: t.textSecondary }}>No decisions match the current filter.</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {decisions.map((d, i) => (
            <div
              key={d.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/project/${id}/decision/${d.id}`)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(`/project/${id}/decision/${d.id}`); }}
              style={{ ...glassCard, cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = t.glassBorderHover;
                e.currentTarget.style.background = t.bgCardHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = t.glassBorder;
                e.currentTarget.style.background = t.bgCard;
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontFamily: "monospace", fontWeight: 700,
                    backgroundColor: t.bgCard, color: t.textPrimary,
                    border: `1px solid ${t.glassBorder}`,
                  }}>
                    {d.sequence_number}
                  </div>
                  {i < decisions.length - 1 && (
                    <div style={{ width: 1, height: 24, marginTop: 4, backgroundColor: t.glassBorder }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={badge(t.accentDim, t.accent)}>{decisionTypeLabel(d.decision_type)}</span>
                    <span style={badge(
                      d.risk_level === "low" ? t.neonGreenDim : d.risk_level === "medium" ? t.neonAmberDim : t.neonRedDim,
                      riskColor(d.risk_level)
                    )}>{d.risk_level}</span>
                    {d.blockchain_tx && <span style={badge(t.tealDim, t.teal)}>On-chain</span>}
                    {d.sensor_trigger_id && <span style={badge(t.neonAmberDim, t.neonAmber)}>IoT Triggered</span>}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: t.textPrimary }}>{d.title}</h3>
                  <p style={{
                    fontSize: 12, color: t.textSecondary, marginBottom: 8,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>{d.description}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 10, color: t.textMuted }}>
                    <span>{formatDate(d.created_at)}</span>
                    {d.cost_impact !== 0 && (
                      <span style={{ color: d.cost_impact > 0 ? t.neonRed : t.neonGreen }}>
                        {d.cost_impact > 0 ? "+" : ""}{formatCurrency(d.cost_impact)}
                      </span>
                    )}
                    <span style={{ fontFamily: "monospace" }}>{truncateHash(d.hash, 6)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
