import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAnalyses, runAnalysis } from "../api/analysis";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import { formatDate } from "../utils/format";
import { Brain, Play, AlertTriangle, Info, AlertCircle } from "lucide-react";
import type { AIAnalysisResult, AIFinding } from "../types";

export default function AIAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [analyses, setAnalyses] = useState<AIAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<AIFinding | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={32} className="text-accent" />
      </div>
    );
  }

  const latest = analyses[0];
  const allFindings = analyses.flatMap((a) => a.findings || []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with run button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-accent" />
          <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
            {analyses.length} analysis run{analyses.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button onClick={handleRunAnalysis} loading={running} size="sm">
          <Play size={14} /> Run Analysis
        </Button>
      </div>

      {/* Risk score card */}
      {latest && (
        <GlassCard padding="lg">
          <h3 className="text-[9px] uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
            Latest Risk Score
          </h3>
          <div className="flex items-center gap-6">
            <div
              className="text-[48px] font-bold"
              style={{
                color: latest.risk_score > 70 ? "#FF3366" : latest.risk_score > 40 ? "#FFB800" : "#00FF88",
              }}
            >
              {latest.risk_score}
            </div>
            <div className="flex-1">
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-divider)" }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${latest.risk_score}%`,
                    background: "linear-gradient(90deg, #00FF88, #FFB800, #FF3366)",
                    boxShadow: `0 0 8px ${latest.risk_score > 70 ? "rgba(255,51,102,0.4)" : "rgba(255,184,0,0.4)"}`,
                  }}
                />
              </div>
              <p className="text-[12px] mt-2" style={{ color: "var(--text-secondary)" }}>
                {latest.summary}
              </p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                {formatDate(latest.created_at)} &middot; {latest.model_version}
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Findings list */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          <h3 className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>
            Findings ({allFindings.length})
          </h3>
          {allFindings.map((f, i) => {
            const icon = f.severity === "critical" ? AlertCircle : f.severity === "warning" ? AlertTriangle : Info;
            const Icon = icon;
            return (
              <GlassCard
                key={i}
                hover
                onClick={() => setSelectedFinding(f)}
                padding="sm"
                className={selectedFinding === f ? "border-accent/40" : ""}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    size={16}
                    className="mt-0.5 shrink-0"
                    style={{
                      color: f.severity === "critical" ? "#FF3366" : f.severity === "warning" ? "#FFB800" : "#4A9EFF",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={`severity-${f.severity}` as any}>{f.severity}</Badge>
                      <Badge variant="ai-flagged">{f.type.replace("_", " ")}</Badge>
                    </div>
                    <h4 className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                      {f.title}
                    </h4>
                    <p className="text-[11px] line-clamp-2 mt-1" style={{ color: "var(--text-secondary)" }}>
                      {f.description}
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Finding detail panel */}
        {selectedFinding && (
          <GlassCard padding="md" className="sticky top-24 h-fit">
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              {selectedFinding.title}
            </h3>
            <div className="space-y-3 text-[12px]" style={{ color: "var(--text-secondary)" }}>
              <div>
                <span className="text-[9px] uppercase tracking-widest font-semibold block mb-1" style={{ color: "var(--text-muted)" }}>
                  Description
                </span>
                {selectedFinding.description}
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest font-semibold block mb-1" style={{ color: "var(--text-muted)" }}>
                  Recommendation
                </span>
                {selectedFinding.recommendation}
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
