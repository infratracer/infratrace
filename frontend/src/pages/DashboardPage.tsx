import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects } from "../api/projects";
import { getDecisions } from "../api/decisions";
import { useProjectStore } from "../store/projectStore";
import { useSensorStore } from "../store/sensorStore";
import { useSensorSocket } from "../hooks/useSensorSocket";
import { useTheme } from "../hooks/useTheme";
import { useIsMobile } from "../hooks/useIsMobile";
import { formatCurrency } from "../utils/format";
import type { Project, Decision, SensorType } from "../types";
import { SENSOR_CONFIG } from "../utils/constants";

export default function DashboardPage() {
  const t = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [projects, setProjectsList] = useState<Project[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const setProjects = useProjectStore((s) => s.setProjects);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const latest = useSensorStore((s) => s.latest);
  const updateReading = useSensorStore((s) => s.updateReading);
  const abortRef = useRef<AbortController | null>(null);

  const loadData = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setLoading(true);
    try {
      const projs = await getProjects();
      if (controller.signal.aborted) return;
      setProjectsList(projs);
      setProjects(projs);
      if (projs.length > 0) {
        const activeId = activeProjectId || projs[0].id;
        setActiveProject(activeId);
        const decs = await getDecisions(activeId);
        if (controller.signal.aborted) return;
        setDecisions(decs);
      }
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
      setError("Unable to load dashboard. Check your connection.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
    return () => abortRef.current?.abort();
  }, []);

  useSensorSocket(activeProjectId || undefined, updateReading);

  const glass = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: t.bgCard,
    backdropFilter: "blur(60px) saturate(150%)",
    WebkitBackdropFilter: "blur(60px) saturate(150%)",
    border: `0.5px solid ${t.glassBorder}`,
    borderRadius: 16,
    boxShadow: t.glassShadow,
    transition: "all 0.2s ease",
    ...extra,
  });

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
        <div style={{
          width: 28, height: 28, border: `2.5px solid ${t.glassBorder}`,
          borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
        <div style={{ ...glass({ maxWidth: 380, width: "100%", textAlign: "center", padding: "36px 28px" }) }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, marginBottom: 6 }}>Unable to Load</p>
          <p style={{ fontSize: 13, color: t.textSecondary, marginBottom: 20 }}>{error}</p>
          <button onClick={loadData} style={{ padding: "8px 20px", background: t.accent, border: "none", borderRadius: 8, color: "#FFF", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Try Again</button>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
        <div style={{ ...glass({ maxWidth: 380, width: "100%", textAlign: "center", padding: "36px 28px" }) }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, marginBottom: 6 }}>No Projects</p>
          <p style={{ fontSize: 13, color: t.textSecondary }}>Create your first project to get started.</p>
        </div>
      </div>
    );
  }

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const drift = totalBudget > 0 ? ((totalSpent - totalBudget) / totalBudget) * 100 : 0;
  const anomCount = Object.values(latest).filter(r => r?.anomaly).length;
  const chainVerifiedCount = decisions.filter(d => d.blockchain_tx).length;
  const chainPct = decisions.length > 0 ? Math.round((chainVerifiedCount / decisions.length) * 100) : 0;
  const activeProject = projects.find(p => p.id === activeProjectId);
  const budget = activeProject?.budget || 0;

  const costData = decisions
    .sort((a, b) => a.sequence_number - b.sequence_number)
    .reduce<{ seq: number; cost: number }[]>((acc, d) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].cost : 0;
      acc.push({ seq: d.sequence_number, cost: prev + d.cost_impact });
      return acc;
    }, []);

  const sensorTypes = Object.keys(SENSOR_CONFIG) as SensorType[];
  const sensorData = sensorTypes.slice(0, 4).map(type => {
    const cfg = SENSOR_CONFIG[type];
    const reading = latest[type];
    return { name: cfg.label, val: reading?.value ?? cfg.base, unit: cfg.unit, thresh: reading?.threshold ?? cfg.range[1], anom: reading?.anomaly ?? false };
  });

  const driftColor = drift > 15 ? t.neonRed : drift > 5 ? t.neonAmber : t.neonGreen;

  const metrics = [
    { label: "Total Budget", value: formatCurrency(totalBudget), sub: `${projects.length} active project${projects.length !== 1 ? "s" : ""}`, color: t.textPrimary },
    { label: "Budget Drift", value: `${drift >= 0 ? "+" : ""}${drift.toFixed(1)}%`, sub: `${formatCurrency(Math.abs(totalSpent - totalBudget))} ${drift >= 0 ? "over" : "under"} budget`, color: driftColor },
    { label: "Sensor Alerts", value: anomCount.toString(), sub: `${decisions.length} decisions tracked`, color: anomCount > 0 ? t.neonRed : t.neonGreen },
    { label: "Chain Status", value: `${chainPct}%`, sub: `${chainVerifiedCount} of ${decisions.length} anchored`, color: chainPct === 100 ? t.neonGreen : t.accent },
  ];

  const riskColor = (risk: string) => risk === "critical" || risk === "high" ? t.neonRed : risk === "medium" ? t.neonAmber : t.neonGreen;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Alert strip */}
      {anomCount > 0 && (
        <div style={{
          marginBottom: 20, padding: "10px 16px", borderRadius: 12,
          background: t.neonAmberDim, border: `0.5px solid ${t.neonAmber}20`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.neonAmber, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 13, color: t.neonAmber, flex: 1 }}>
            {anomCount} sensor alert{anomCount !== 1 ? "s" : ""} detected
          </span>
          <span onClick={() => activeProjectId && navigate(`/project/${activeProjectId}/sensors`)}
            style={{ fontSize: 12, color: t.textSecondary, cursor: "pointer" }}>View &rarr;</span>
        </div>
      )}

      {/* Metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {metrics.map((m, i) => (
          <div key={i} style={glass({ padding: "16px 18px" })}>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 8, fontWeight: 500 }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: m.color, letterSpacing: "-0.5px", lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 8 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Cost trajectory — using Recharts for proper responsive chart */}
      {costData.length > 1 && (
        <div style={glass({ padding: "18px 20px", marginBottom: 20 })}>
          <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4, fontWeight: 500 }}>Cost Trajectory</div>
          <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 16 }}>{activeProject?.name}</div>
          <div style={{ width: "100%", height: 180, position: "relative" }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${Math.max(costData.length * 40, 400)} 180`} preserveAspectRatio="xMidYMid meet">
              {(() => {
                const w = Math.max(costData.length * 40, 400);
                const pad = { t: 20, r: 60, b: 30, l: 10 };
                const cw = w - pad.l - pad.r;
                const ch = 180 - pad.t - pad.b;
                const maxCost = Math.max(...costData.map(d => d.cost), budget) * 1.15;
                const sx = (i: number) => pad.l + (i / (costData.length - 1)) * cw;
                const sy = (v: number) => pad.t + ch - (v / maxCost) * ch;
                const budgetY = sy(budget);
                const pts = costData.map((d, i) => `${sx(i)},${sy(d.cost)}`).join(" ");

                return (
                  <>
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(p => (
                      <line key={p} x1={pad.l} y1={pad.t + ch * (1 - p)} x2={w - pad.r} y2={pad.t + ch * (1 - p)} stroke={t.chartGrid} strokeWidth="0.5" />
                    ))}
                    {/* Budget line */}
                    <line x1={pad.l} y1={budgetY} x2={w - pad.r} y2={budgetY} stroke={t.textMuted} strokeWidth="1" strokeDasharray="4,4" />
                    <text x={w - pad.r + 6} y={budgetY + 3} fontSize="10" fill={t.textMuted} fontFamily="inherit">Budget</text>
                    {/* Area fill */}
                    <polygon points={`${pts} ${sx(costData.length - 1)},${pad.t + ch} ${sx(0)},${pad.t + ch}`} fill={t.accent} opacity="0.06" />
                    {/* Line */}
                    <polyline points={pts} fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Dots */}
                    {costData.map((d, i) => (
                      <circle key={i} cx={sx(i)} cy={sy(d.cost)} r={3}
                        fill={d.cost > budget ? t.neonRed : t.accent}
                        stroke={t.mode === "dark" ? "#1C1C1E" : "#F2F2F7"} strokeWidth="1.5" />
                    ))}
                    {/* End label */}
                    {costData.length > 0 && (
                      <text x={sx(costData.length - 1)} y={sy(costData[costData.length - 1].cost) - 10}
                        textAnchor="end" fontSize="12" fill={costData[costData.length - 1].cost > budget ? t.neonRed : t.accent} fontWeight="600" fontFamily="inherit">
                        {formatCurrency(costData[costData.length - 1].cost)}
                      </text>
                    )}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      )}

      {/* Projects + Sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: 16 }}>
        {/* Projects */}
        <div>
          <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 10, fontWeight: 500 }}>Projects</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {projects.map((p, i) => {
              const pct = p.budget > 0 ? ((p.spent - p.budget) / p.budget) * 100 : 0;
              const isHovered = hoveredProject === i;
              return (
                <div key={p.id} role="button" tabIndex={0}
                  onMouseEnter={() => setHoveredProject(i)}
                  onMouseLeave={() => setHoveredProject(null)}
                  onClick={() => { setActiveProject(p.id); navigate(`/project/${p.id}/timeline`); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { setActiveProject(p.id); navigate(`/project/${p.id}/timeline`); } }}
                  style={glass({
                    padding: "16px 18px", cursor: "pointer",
                    background: isHovered ? t.bgCardHover : t.bgCard,
                    border: `0.5px solid ${isHovered ? t.glassBorderHover : t.glassBorder}`,
                    transform: isHovered ? "translateY(-1px)" : "none",
                  })}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary }}>{p.name}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6,
                      color: riskColor(p.risk_level),
                      background: p.risk_level === "critical" || p.risk_level === "high" ? t.neonRedDim : p.risk_level === "medium" ? t.neonAmberDim : t.neonGreenDim,
                    }}>{p.risk_level}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: t.textSecondary }}>{formatCurrency(p.budget)}</span>
                    <span style={{ color: t.textMuted }}>&rarr;</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: pct > 15 ? t.neonRed : t.textPrimary }}>{formatCurrency(p.spent)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: pct > 15 ? t.neonRed : pct > 5 ? t.neonAmber : t.neonGreen }}>
                      {pct >= 0 ? "+" : ""}{pct.toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ height: 3, background: t.divider, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 2,
                      width: `${Math.min(Math.abs(pct) / 50 * 100, 100)}%`,
                      background: pct > 15 ? t.neonRed : pct > 5 ? t.neonAmber : t.neonGreen,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  <p style={{ fontSize: 12, color: t.textMuted, marginTop: 8 }}>{p.description.slice(0, 80)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Sensors */}
          <div>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 10, fontWeight: 500 }}>Live Sensors</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {sensorData.map((s, i) => (
                <div key={i} style={glass({ padding: "12px 14px" })}>
                  <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 6, fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.anom ? t.neonRed : t.textPrimary, lineHeight: 1 }}>{s.val.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
                  <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{s.unit}</div>
                  <div style={{ marginTop: 8, height: 2, background: t.divider, borderRadius: 1, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 1,
                      width: `${Math.min(s.val / s.thresh * 100, 100)}%`,
                      background: s.anom ? t.neonRed : s.val / s.thresh > 0.85 ? t.neonAmber : t.neonGreen,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 10, fontWeight: 500 }}>Recent Activity</div>
            {decisions.length === 0 ? (
              <div style={glass({ padding: "20px 16px", textAlign: "center" })}>
                <p style={{ fontSize: 13, color: t.textMuted }}>No activity yet</p>
              </div>
            ) : (
              <div style={glass({ padding: "12px 14px" })}>
                {decisions.slice(0, 5).map((d, i) => (
                  <div key={d.id} style={{
                    padding: "10px 0",
                    borderBottom: i < Math.min(decisions.length, 5) - 1 ? `0.5px solid ${t.divider}` : "none",
                  }}>
                    <div style={{ fontSize: 13, color: t.textPrimary, fontWeight: 500, marginBottom: 2 }}>{d.title}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: t.textMuted }}>
                      <span>{d.cost_impact !== 0 ? `${d.cost_impact > 0 ? "+" : ""}${formatCurrency(d.cost_impact)}` : d.decision_type.replace(/_/g, " ")}</span>
                      <span>#{d.sequence_number}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
