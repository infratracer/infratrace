import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getAnalyses, runAnalysis } from "../api/analysis";
import { useTheme } from "../hooks/useTheme";
import { useIsMobile } from "../hooks/useIsMobile";
import { useToastStore } from "../store/toastStore";
import { formatDate } from "../utils/format";
import type { AIAnalysisResult } from "../types";

const TYPE_LABELS: Record<string, string> = {
  scope_creep: "Scope Creep",
  cost_anomaly: "Cost Anomaly",
  assumption_drift: "Assumption Drift",
  approval_pattern: "Approval Risk",
  sensor_contradiction: "Sensor Alert",
  schedule_risk: "Schedule Risk",
  risk_assessment: "Risk Assessment",
};

export default function AIAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [findings, setFindings] = useState<AIAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<AIAnalysisResult | null>(null);
  const t = useTheme();
  const isMobile = useIsMobile();
  const addToast = useToastStore((s) => s.addToast);
  const abortRef = useRef<AbortController | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    try {
      const data = await getAnalyses(id);
      if (controller.signal.aborted) return;
      setFindings(data);
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
      setError("Failed to load analysis results.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
    return () => {
      abortRef.current?.abort();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadData]);

  const handleRun = async () => {
    if (!id) return;
    setRunning(true);
    try {
      await runAnalysis(id);
      addToast("Analysis running — this may take a moment...", "info");
      let attempts = 0;
      const startCount = findings.length;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const data = await getAnalyses(id);
          if (data.length > startCount) {
            if (pollRef.current) clearInterval(pollRef.current);
            setFindings(data);
            setRunning(false);
            addToast("Analysis complete!", "success");
          } else if (attempts >= 15) {
            if (pollRef.current) clearInterval(pollRef.current);
            setFindings(data);
            setRunning(false);
            addToast("Analysis may still be processing. Refresh to check.", "info");
          }
        } catch {
          if (pollRef.current) clearInterval(pollRef.current);
          setRunning(false);
        }
      }, 2000);
    } catch {
      addToast("Failed to start analysis.", "error");
      setRunning(false);
    }
  };

  const glass = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: t.bgCard,
    backdropFilter: "blur(60px) saturate(150%)",
    WebkitBackdropFilter: "blur(60px) saturate(150%)",
    border: `0.5px solid ${t.glassBorder}`,
    borderRadius: 16,
    boxShadow: t.glassShadow,
    padding: "18px",
    ...extra,
  });

  const sevColor = (s: string) => s === "critical" ? t.neonRed : s === "warning" ? t.neonAmber : t.accent;
  const sevBg = (s: string) => s === "critical" ? t.neonRedDim : s === "warning" ? t.neonAmberDim : t.accentDim;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <div style={{ width: 28, height: 28, border: `2.5px solid ${t.glassBorder}`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 256 }}>
        <div style={glass({ maxWidth: 380, width: "100%", textAlign: "center", padding: "36px 28px" })}>
          <p style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, marginBottom: 6 }}>Unable to Load</p>
          <p style={{ fontSize: 13, color: t.textSecondary, marginBottom: 20 }}>{error}</p>
          <button onClick={loadData} style={{ padding: "8px 20px", background: t.accent, border: "none", borderRadius: 8, color: "#FFF", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Try Again</button>
        </div>
      </div>
    );
  }

  // Compute risk score from findings
  const criticalCount = findings.filter(f => f.severity === "critical").length;
  const warningCount = findings.filter(f => f.severity === "warning").length;
  const riskScore = Math.min(100, criticalCount * 30 + warningCount * 15 + findings.length * 3);
  const avgConfidence = findings.length > 0
    ? Math.round(findings.reduce((s, f) => s + (f.confidence_score || 0), 0) / findings.length * 100)
    : 0;

  return (
    <div style={{ animation: "fadeIn 0.3s ease", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, margin: 0 }}>Risk Analysis</h3>
          <p style={{ fontSize: 13, color: t.textSecondary, margin: "4px 0 0" }}>
            AI-powered analysis of decision patterns, cost anomalies, and sensor data
          </p>
        </div>
        <button onClick={handleRun} disabled={running}
          style={{
            padding: "9px 18px", background: t.accent, border: "none", borderRadius: 10,
            color: "#FFF", fontSize: 13, fontWeight: 500, fontFamily: "inherit",
            cursor: running ? "not-allowed" : "pointer", opacity: running ? 0.6 : 1,
            display: "flex", alignItems: "center", gap: 6, boxShadow: t.btnShadow,
          }}>
          {running ? "Analysing..." : "Run Analysis"}
        </button>
      </div>

      {/* Empty state */}
      {findings.length === 0 && (
        <div style={glass({ textAlign: "center", padding: "48px 28px" })}>
          <p style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>{"\u25C7"}</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, marginBottom: 4 }}>No Analysis Results</p>
          <p style={{ fontSize: 13, color: t.textSecondary, maxWidth: 340, margin: "0 auto" }}>
            Click "Run Analysis" to scan this project for risk patterns, cost anomalies, and governance issues.
          </p>
        </div>
      )}

      {findings.length > 0 && (
        <>
          {/* Score cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
            <div style={glass({ padding: "14px 16px" })}>
              <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 6 }}>Risk Score</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: riskScore > 60 ? t.neonRed : riskScore > 30 ? t.neonAmber : t.neonGreen }}>{riskScore}</div>
              <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: t.divider, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${riskScore}%`, borderRadius: 2, background: riskScore > 60 ? t.neonRed : riskScore > 30 ? t.neonAmber : t.neonGreen, transition: "width 0.5s" }} />
              </div>
            </div>
            <div style={glass({ padding: "14px 16px" })}>
              <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 6 }}>Findings</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: t.textPrimary }}>{findings.length}</div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{criticalCount} critical, {warningCount} warning</div>
            </div>
            <div style={glass({ padding: "14px 16px" })}>
              <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 6 }}>Confidence</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: t.textPrimary }}>{avgConfidence}%</div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>average score</div>
            </div>
            <div style={glass({ padding: "14px 16px" })}>
              <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 6 }}>Model</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.accent, marginTop: 8 }}>{findings[0]?.model_version?.split("/").pop()?.replace(":free", "") || "rule-based"}</div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{formatDate(findings[0]?.created_at)}</div>
            </div>
          </div>

          {/* Findings list + detail */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, color: t.textSecondary, fontWeight: 500 }}>All Findings</div>
              {findings.map((f) => (
                <div key={f.id} role="button" tabIndex={0}
                  onClick={() => setSelected(f)}
                  onKeyDown={(e) => { if (e.key === "Enter") setSelected(f); }}
                  style={glass({
                    padding: "14px 16px", cursor: "pointer",
                    border: `0.5px solid ${selected?.id === f.id ? t.accent : t.glassBorder}`,
                  })}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                      background: sevBg(f.severity), color: sevColor(f.severity),
                    }}>{f.severity}</span>
                    <span style={{ fontSize: 12, color: t.accent, fontWeight: 500 }}>
                      {TYPE_LABELS[f.analysis_type] || f.analysis_type}
                    </span>
                    {f.confidence_score && (
                      <span style={{ fontSize: 11, color: t.textMuted, marginLeft: "auto" }}>
                        {Math.round(f.confidence_score * 100)}%
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: 13, color: t.textPrimary, margin: 0, lineHeight: 1.5,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>{f.finding}</p>
                </div>
              ))}
            </div>

            {/* Detail panel */}
            {selected ? (
              <div style={glass({ position: isMobile ? "relative" : "sticky", top: 80, height: "fit-content" })}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                    background: sevBg(selected.severity), color: sevColor(selected.severity),
                  }}>{selected.severity}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>
                    {TYPE_LABELS[selected.analysis_type] || selected.analysis_type}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.7, margin: "0 0 16px" }}>
                  {selected.finding}
                </p>
                {selected.related_decisions && selected.related_decisions.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 4, fontWeight: 500 }}>Affected Decisions</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {selected.related_decisions.map((d, i) => (
                        <span key={i} style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: 6,
                          background: t.bgElevated, color: t.textSecondary,
                        }}>#{String(d)}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: t.textMuted }}>
                  <span>Confidence: {selected.confidence_score ? `${Math.round(selected.confidence_score * 100)}%` : "N/A"}</span>
                  <span>{selected.model_version}</span>
                </div>
              </div>
            ) : (
              <div style={glass({ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 })}>
                <p style={{ fontSize: 13, color: t.textMuted }}>Select a finding to see details</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
