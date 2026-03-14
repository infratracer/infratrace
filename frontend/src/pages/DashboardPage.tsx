import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects } from "../api/projects";
import { getDecisions } from "../api/decisions";
import { useProjectStore } from "../store/projectStore";
import { useSensorStore } from "../store/sensorStore";
import { useSensorSocket } from "../hooks/useSensorSocket";
import { useTheme } from "../hooks/useTheme";
import { formatCurrency } from "../utils/format";
import type { Project, Decision, SensorType } from "../types";
import { SENSOR_CONFIG } from "../utils/constants";

export default function DashboardPage() {
  const t = useTheme();
  const navigate = useNavigate();
  const [projects, setProjectsList] = useState<Project[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const [hoveredMetric, setHoveredMetric] = useState<number | null>(null);
  const setProjects = useProjectStore((s) => s.setProjects);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const latest = useSensorStore((s) => s.latest);
  const updateReading = useSensorStore((s) => s.updateReading);

  useEffect(() => {
    (async () => {
      try {
        const projs = await getProjects();
        setProjectsList(projs);
        setProjects(projs);
        if (projs.length > 0) {
          const activeId = activeProjectId || projs[0].id;
          setActiveProject(activeId);
          const decs = await getDecisions(activeId);
          setDecisions(decs);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useSensorSocket(activeProjectId || undefined, updateReading);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
        <div style={{
          width: 32, height: 32,
          border: `3px solid ${t.glassBorder}`,
          borderTopColor: t.accent,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const drift = totalBudget > 0 ? ((totalSpent - totalBudget) / totalBudget) * 100 : 0;
  const anomCount = Object.values(latest).filter(r => r?.anomaly).length;

  const glassCard = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: t.bgCard,
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 18,
    boxShadow: `${t.glassShadow}, ${t.glassInnerGlow}`,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    ...extra,
  });

  const Badge = ({ text, color, bg }: { text: string; color: string; bg: string }) => (
    <span style={{
      fontSize: 9, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
      background: bg, color, letterSpacing: "0.03em",
    }}>{text}</span>
  );

  const riskColor = (risk: string) => risk === "critical" || risk === "high" ? t.neonRed : risk === "medium" ? t.neonAmber : t.neonGreen;
  const riskBg = (risk: string) => risk === "critical" || risk === "high" ? t.neonRedDim : risk === "medium" ? t.neonAmberDim : t.neonGreenDim;

  const actIcon: Record<string, string> = { scope_change: "\u25CB", cost_revision: "\u25CB", assumption_change: "\u25C7", contractor_change: "\u25C9", schedule_change: "\u25CB", risk_acceptance: "\u25C7", approval: "\u26D3" };
  const actColor: Record<string, string> = { scope_change: t.accent, cost_revision: t.neonRed, assumption_change: t.neonAmber, contractor_change: t.teal, schedule_change: t.textSecondary, risk_acceptance: t.neonAmber, approval: t.neonGreen };

  const costData = decisions
    .sort((a, b) => a.sequence_number - b.sequence_number)
    .reduce<{ seq: number; cost: number }[]>((acc, d) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].cost : 0;
      acc.push({ seq: d.sequence_number, cost: prev + d.cost_impact });
      return acc;
    }, []);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const budget = activeProject?.budget || 0;

  const sensorTypes = Object.keys(SENSOR_CONFIG) as SensorType[];
  const sensorData = sensorTypes.slice(0, 4).map(type => {
    const cfg = SENSOR_CONFIG[type];
    const reading = latest[type];
    return {
      name: cfg.label,
      val: reading?.value ?? cfg.base,
      unit: cfg.unit,
      thresh: reading?.threshold ?? cfg.range[1],
      anom: reading?.anomaly ?? false,
    };
  });

  const metrics = [
    { label: "BUDGET EXPOSURE", value: formatCurrency(totalBudget), sub: `${projects.length} active projects`, color: t.textPrimary, glow: t.accentDim, accentLine: t.accent },
    { label: "BUDGET DRIFT", value: `${drift >= 0 ? "+" : ""}${drift.toFixed(1)}%`, sub: `${formatCurrency(Math.abs(totalSpent - totalBudget))} ${drift >= 0 ? "over" : "under"}`, color: drift > 10 ? t.neonRed : drift > 5 ? t.neonAmber : t.neonGreen, glow: drift > 10 ? t.neonRedDim : t.accentDim, accentLine: drift > 10 ? t.neonRed : t.neonAmber },
    { label: "ACTIVE ANOMALIES", value: anomCount.toString(), sub: `${decisions.length} total decisions`, color: anomCount > 0 ? t.neonRed : t.neonGreen, glow: anomCount > 0 ? t.neonRedDim : t.neonGreenDim, accentLine: anomCount > 0 ? t.neonRed : t.neonGreen },
    { label: "CHAIN STATUS", value: "100%", sub: `${decisions.length} records verified`, color: t.neonGreen, glow: t.neonGreenDim, accentLine: t.neonGreen },
  ];

  return (
    <div>
      {/* Alert strip */}
      {anomCount > 0 && (
        <div style={{
          marginBottom: 24, padding: "12px 18px", borderRadius: 14,
          background: `linear-gradient(90deg, ${t.neonAmberDim}, transparent)`,
          border: `1px solid ${t.neonAmber}18`,
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          backdropFilter: "blur(20px)",
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", background: t.neonAmber,
            boxShadow: `0 0 12px ${t.neonAmber}80`,
            animation: "pulse 2s ease-in-out infinite",
          }} />
          <span style={{ fontSize: 13, color: t.neonAmber, flex: 1 }}>
            {anomCount} sensor anomal{anomCount === 1 ? "y" : "ies"} detected
          </span>
          <span
            onClick={() => activeProjectId && navigate(`/project/${activeProjectId}/sensors`)}
            style={{ fontSize: 11, color: t.textMuted, cursor: "pointer", fontWeight: 500 }}
          >
            View {"\u2192"}
          </span>
        </div>
      )}

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
        {metrics.map((m, i) => (
          <div
            key={i}
            onMouseEnter={() => setHoveredMetric(i)}
            onMouseLeave={() => setHoveredMetric(null)}
            style={{
              ...glassCard({
                padding: "22px 20px 18px",
                background: `linear-gradient(135deg, ${m.glow}, ${t.bgCard})`,
                transform: hoveredMetric === i ? "translateY(-2px)" : "none",
                border: `1px solid ${hoveredMetric === i ? t.glassBorderHover : t.glassBorder}`,
              }),
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top accent line */}
            <div style={{
              position: "absolute", top: 0, left: 20, right: 20, height: 2,
              background: `linear-gradient(90deg, ${m.accentLine}40, transparent)`,
              borderRadius: "0 0 2px 2px",
            }} />
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", color: t.textMuted, marginBottom: 12, textTransform: "uppercase" }}>{m.label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: m.color, letterSpacing: "-0.02em", lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 10 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Cost trajectory */}
      {costData.length > 1 && (
        <div style={glassCard({ padding: "24px 24px", marginBottom: 28 })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", color: t.textMuted, textTransform: "uppercase" }}>Cost Trajectory</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: t.textSecondary, marginTop: 4 }}>{activeProject?.name || "Project"}</div>
            </div>
          </div>
          <svg width="100%" height="160" viewBox="0 0 500 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`cg-${t.mode}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.neonRed} stopOpacity="0.2" />
                <stop offset="50%" stopColor={t.neonAmber} stopOpacity="0.05" />
                <stop offset="100%" stopColor={t.neonGreen} stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`line-${t.mode}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={t.neonGreen} />
                <stop offset="50%" stopColor={t.neonAmber} />
                <stop offset="100%" stopColor={t.neonRed} />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map(y => (
              <line key={y} x1="0" y1={10 + y * 130} x2="500" y2={10 + y * 130} stroke={t.chartGrid} strokeWidth="1" />
            ))}
            {(() => {
              const maxCost = Math.max(...costData.map(d => d.cost), budget) * 1.1;
              const scaleX = (i: number) => i / (costData.length - 1) * 500;
              const scaleY = (v: number) => 140 - (v / maxCost) * 130;
              const budgetY = scaleY(budget);
              const points = costData.map((d, i) => `${scaleX(i)},${scaleY(d.cost)}`).join(" ");
              const areaPath = `M${points} L500,140 L0,140 Z`;

              return (
                <>
                  <line x1="0" y1={budgetY} x2="500" y2={budgetY} stroke={t.textMuted} strokeWidth="1" strokeDasharray="6,4" opacity="0.4" />
                  <text x="495" y={budgetY - 6} textAnchor="end" fontSize="9" fill={t.textMuted}>Budget</text>
                  <path d={areaPath} fill={`url(#cg-${t.mode})`} />
                  <polyline points={points} fill="none" stroke={`url(#line-${t.mode})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {costData.map((d, i) => (
                    <circle key={i} cx={scaleX(i)} cy={scaleY(d.cost)} r={5} fill={t.bg} stroke={d.cost > budget ? t.neonRed : d.cost > budget * 0.7 ? t.neonAmber : t.neonGreen} strokeWidth={2} />
                  ))}
                  {costData.length > 0 && (
                    <>
                      <circle cx={scaleX(costData.length - 1)} cy={scaleY(costData[costData.length - 1].cost)} r={6} fill={t.neonRed} style={{ filter: `drop-shadow(0 0 8px ${t.neonRed}80)` }} />
                      <text x={scaleX(costData.length - 1) - 8} y={scaleY(costData[costData.length - 1].cost) - 12} textAnchor="end" fontSize="12" fill={t.neonRed} fontWeight="600">
                        {formatCurrency(costData[costData.length - 1].cost)}
                      </text>
                    </>
                  )}
                </>
              );
            })()}
          </svg>
        </div>
      )}

      {/* Projects + Sensors/Activity grid */}
      <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "1fr 340px", gap: 20 }}>
        {/* Project cards */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", color: t.textMuted, textTransform: "uppercase", marginBottom: 12 }}>Projects</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {projects.map((p, i) => {
              const pct = p.budget > 0 ? ((p.spent - p.budget) / p.budget) * 100 : 0;
              const isHovered = hoveredProject === i;
              return (
                <div
                  key={p.id}
                  onMouseEnter={() => setHoveredProject(i)}
                  onMouseLeave={() => setHoveredProject(null)}
                  onClick={() => { setActiveProject(p.id); navigate(`/project/${p.id}/timeline`); }}
                  style={glassCard({
                    padding: "20px 22px", cursor: "pointer",
                    background: isHovered ? t.bgCardHover : t.bgCard,
                    border: `1px solid ${isHovered ? t.glassBorderHover : t.glassBorder}`,
                    transform: isHovered ? "translateY(-2px)" : "none",
                    boxShadow: isHovered ? `${t.glassShadow}, 0 12px 40px rgba(0,0,0,0.15)` : t.glassShadow,
                  })}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, letterSpacing: "-0.1px" }}>{p.name}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Badge text={p.risk_level.toUpperCase()} color={riskColor(p.risk_level)} bg={riskBg(p.risk_level)} />
                      <Badge text={"\u26D3 \u2713"} color={t.neonGreen} bg={t.neonGreenDim} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: t.textSecondary }}>{formatCurrency(p.budget)}</span>
                    <span style={{ color: t.textMuted, fontSize: 11 }}>{"\u2192"}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: pct > 15 ? t.neonRed : t.textPrimary }}>{formatCurrency(p.spent)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: pct > 15 ? t.neonRed : pct > 5 ? t.neonAmber : t.neonGreen }}>
                      {pct >= 0 ? "+" : ""}{pct.toFixed(0)}%
                    </span>
                  </div>
                  {/* Budget drift bar */}
                  <div style={{ height: 3, background: t.divider, borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
                    <div style={{
                      height: "100%", borderRadius: 2,
                      width: `${Math.min(Math.abs(pct) / 70 * 100, 100)}%`,
                      background: pct > 15 ? `linear-gradient(90deg, ${t.neonAmber}, ${t.neonRed})` : pct > 5 ? t.neonAmber : t.neonGreen,
                      boxShadow: `0 0 8px ${pct > 15 ? t.neonRed + "40" : t.neonGreen + "40"}`,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: t.textMuted }}>
                    <span style={{ color: t.textSecondary }}>{p.description.slice(0, 70)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Sensor mini cards */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", color: t.textMuted, textTransform: "uppercase", marginBottom: 12 }}>Sensors</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {sensorData.map((s, i) => (
                <div key={i} style={glassCard({
                  padding: "14px 16px",
                  border: `1px solid ${s.anom ? t.neonRed + "30" : t.glassBorder}`,
                  boxShadow: s.anom ? `0 0 20px ${t.neonRed}10, ${t.glassInnerGlow}` : `${t.glassShadow}, ${t.glassInnerGlow}`,
                })}>
                  <div style={{ fontSize: 8, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{s.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.anom ? t.neonRed : t.textPrimary, lineHeight: 1, letterSpacing: "-0.5px" }}>{s.val.toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: t.textMuted, marginTop: 3 }}>{s.unit}</div>
                  <div style={{ marginTop: 10, height: 3, background: t.divider, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 2,
                      width: `${Math.min(s.val / s.thresh * 100, 100)}%`,
                      background: s.anom ? t.neonRed : s.val / s.thresh > 0.85 ? t.neonAmber : t.neonGreen,
                      boxShadow: s.anom ? `0 0 8px ${t.neonRed}60` : "none",
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", color: t.textMuted, textTransform: "uppercase", marginBottom: 12 }}>Activity</div>
            <div style={glassCard({ padding: "16px 18px" })}>
              {decisions.slice(0, 6).map((d, i) => (
                <div key={d.id} style={{
                  padding: "12px 0",
                  borderBottom: i < Math.min(decisions.length, 6) - 1 ? `1px solid ${t.divider}` : "none",
                  cursor: "pointer",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{
                      color: actColor[d.decision_type] || t.accent, fontSize: 12, marginTop: 2,
                      textShadow: `0 0 8px ${(actColor[d.decision_type] || t.accent)}30`,
                    }}>
                      {actIcon[d.decision_type] || "\u25CB"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.5, fontWeight: 500 }}>{d.title}</div>
                      <div style={{ fontSize: 10, color: t.textMuted, marginTop: 3 }}>
                        {d.cost_impact !== 0 ? `${d.cost_impact > 0 ? "+" : ""}${formatCurrency(d.cost_impact)}` : d.decision_type.replace("_", " ")}
                      </div>
                    </div>
                    <span style={{ fontSize: 9, color: t.textMuted, flexShrink: 0, fontWeight: 500 }}>#{d.sequence_number}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
