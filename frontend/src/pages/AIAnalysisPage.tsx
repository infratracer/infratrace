import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAnalyses, runAnalysis } from "../api/analysis";
import { useTheme } from "../hooks/useTheme";
import { formatDate } from "../utils/format";
import type { AIAnalysisResult, AIFinding } from "../types";

export default function AIAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [analyses, setAnalyses] = useState<AIAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<AIFinding | null>(null);
  const t = useTheme();

  const loadData = async () => {
    if (!id) return;
    try {
      const data = await getAnalyses(id);
      setAnalyses(data);
    } catch (err) {
      console.error("Failed to load analyses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleRunAnalysis = async () => {
    if (!id) return;
    setRunning(true);
    try {
      await runAnalysis(id);
      setTimeout(() => loadData(), 3000);
    } catch (err) {
      console.error("Failed to run analysis:", err);
    } finally {
      setRunning(false);
    }
  };

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

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <span style={{ fontSize: 32, color: t.accent, animation: "spin 1s linear infinite" }}>◇</span>
      </div>
    );
  }

  const latest = analyses[0];
  const allFindings = analyses.flatMap((a) => a.findings || []);

  const severityIcon = (severity: string) => {
    if (severity === "critical") return "⚡";
    if (severity === "warning") return "⚠";
    return "ℹ";
  };

  const severityColor = (severity: string) => {
    if (severity === "critical") return "#FF3366";
    if (severity === "warning") return "#FFB800";
    return "#4A9EFF";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header with run button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20, color: t.accent }}>◇</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: t.textSecondary }}>
            {analyses.length} analysis run{analyses.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={running}
          style={{
            padding: "10px 20px",
            background: t.accent,
            border: "none",
            borderRadius: 10,
            color: "#FFF",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: running ? "not-allowed" : "pointer",
            opacity: running ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: t.btnShadow,
          }}
        >
          <span>▶</span> {running ? "Running..." : "Run Analysis"}
        </button>
      </div>

      {/* Risk score card */}
      {latest && (
        <div style={{ ...glassCard, padding: 24 }}>
          <h3 style={{ ...overline, marginBottom: 12 }}>
            Latest Risk Score
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: latest.risk_score > 70 ? "#FF3366" : latest.risk_score > 40 ? "#FFB800" : "#00FF88",
              }}
            >
              {latest.risk_score}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 12, borderRadius: 9999, overflow: "hidden", backgroundColor: t.divider }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 9999,
                    transition: "all 1s",
                    width: `${latest.risk_score}%`,
                    background: "linear-gradient(90deg, #00FF88, #FFB800, #FF3366)",
                    boxShadow: `0 0 8px ${latest.risk_score > 70 ? "rgba(255,51,102,0.4)" : "rgba(255,184,0,0.4)"}`,
                  }}
                />
              </div>
              <p style={{ fontSize: 12, marginTop: 8, color: t.textSecondary }}>
                {latest.summary}
              </p>
              <p style={{ fontSize: 10, marginTop: 4, color: t.textMuted }}>
                {formatDate(latest.created_at)} &middot; {latest.model_version}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Findings list */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "2fr 1fr" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={overline}>
            Findings ({allFindings.length})
          </h3>
          {allFindings.map((f, i) => (
            <div
              key={i}
              onClick={() => setSelectedFinding(f)}
              style={{
                ...glassCard,
                padding: 12,
                cursor: "pointer",
                border: selectedFinding === f
                  ? `1px solid ${t.accent}`
                  : `1px solid ${t.glassBorder}`,
                transition: "border-color 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span
                  style={{
                    marginTop: 2,
                    flexShrink: 0,
                    fontSize: 16,
                    color: severityColor(f.severity),
                  }}
                >
                  {severityIcon(f.severity)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: severityColor(f.severity) + "22",
                        color: severityColor(f.severity),
                      }}
                    >
                      {f.severity}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: t.accentDim,
                        color: t.accent,
                      }}
                    >
                      {f.type.replace("_", " ")}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 13, fontWeight: 500, color: t.textPrimary }}>
                    {f.title}
                  </h4>
                  <p
                    style={{
                      fontSize: 11,
                      marginTop: 4,
                      color: t.textSecondary,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {f.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Finding detail panel */}
        {selectedFinding && (
          <div style={{ ...glassCard, position: "sticky", top: 96, height: "fit-content" }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: t.textPrimary }}>
              {selectedFinding.title}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12, color: t.textSecondary }}>
              <div>
                <span style={{ ...overline, display: "block", marginBottom: 4 }}>
                  Description
                </span>
                {selectedFinding.description}
              </div>
              <div>
                <span style={{ ...overline, display: "block", marginBottom: 4 }}>
                  Recommendation
                </span>
                {selectedFinding.recommendation}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
