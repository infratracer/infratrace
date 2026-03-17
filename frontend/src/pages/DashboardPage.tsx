import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects, createProject } from "../api/projects";
import { getDecisions } from "../api/decisions";
import { useProjectStore } from "../store/projectStore";
import { useSensorStore } from "../store/sensorStore";
import { useSensorSocket } from "../hooks/useSensorSocket";
import { useTheme } from "../hooks/useTheme";
import { useIsMobile } from "../hooks/useIsMobile";
import { formatCurrency } from "../utils/format";
import type { Project, Decision } from "../types";
import { SENSOR_CONFIG } from "../utils/constants";
import { getSensorConfigs, type SensorConfig } from "../api/projectSensors";
import { useToastStore } from "../store/toastStore";
import WelcomeBanner from "../components/dashboard/WelcomeBanner";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";

export default function DashboardPage() {
  const t = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [projects, setProjectsList] = useState<Project[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [sensorConfigs, setSensorConfigs] = useState<SensorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const setProjects = useProjectStore((s) => s.setProjects);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const latest = useSensorStore((s) => s.latest);
  const updateReading = useSensorStore((s) => s.updateReading);
  const addToast = useToastStore((s) => s.addToast);
  const abortRef = useRef<AbortController | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "", original_budget: "" });
  const [creatingProject, setCreatingProject] = useState(false);

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.description) {
      addToast("Name and description are required.", "error");
      return;
    }
    setCreatingProject(true);
    try {
      const proj = await createProject({
        name: newProject.name,
        description: newProject.description,
        original_budget: parseFloat(newProject.original_budget) || 0,
      });
      setShowCreateProject(false);
      setNewProject({ name: "", description: "", original_budget: "" });
      addToast("Project created!", "success");
      setActiveProject(proj.id);
      loadData();
    } catch {
      addToast("Failed to create project.", "error");
    } finally {
      setCreatingProject(false);
    }
  };

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
        const [decs, configs] = await Promise.all([
          getDecisions(activeId),
          getSensorConfigs(activeId).catch(() => []),
        ]);
        if (controller.signal.aborted) return;
        setDecisions(decs);
        setSensorConfigs(configs);
      }
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
      setError("Unable to load dashboard. Check your connection.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

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
      <>
        <WelcomeBanner onCreateProject={() => setShowCreateProject(true)} />
        {/* Create Project Modal */}
        {showCreateProject && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
            <div style={glass({ maxWidth: 400, width: "90%", padding: "28px 24px" })}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, margin: "0 0 16px" }}>New Project</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>Project Name</div>
                  <input value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} placeholder="e.g. EnergyConnect Phase 2"
                    style={{ width: "100%", padding: "10px 12px", background: t.bgInput, border: `0.5px solid ${t.glassBorder}`, borderRadius: 10, color: t.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>Description</div>
                  <textarea value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of the project..."
                    style={{ width: "100%", padding: "10px 12px", background: t.bgInput, border: `0.5px solid ${t.glassBorder}`, borderRadius: 10, color: t.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", minHeight: 60, resize: "vertical" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>Original Budget (AUD)</div>
                  <input type="number" value={newProject.original_budget} onChange={e => setNewProject(p => ({ ...p, original_budget: e.target.value }))} placeholder="0"
                    style={{ width: "100%", padding: "10px 12px", background: t.bgInput, border: `0.5px solid ${t.glassBorder}`, borderRadius: 10, color: t.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={() => setShowCreateProject(false)} style={{ flex: 1, padding: "9px", background: "transparent", border: `0.5px solid ${t.glassBorder}`, borderRadius: 10, color: t.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                  <button onClick={handleCreateProject} disabled={creatingProject} style={{ flex: 1, padding: "9px", background: t.accent, border: "none", borderRadius: 10, color: "#FFF", fontSize: 13, fontWeight: 500, cursor: creatingProject ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: creatingProject ? 0.6 : 1 }}>{creatingProject ? "Creating..." : "Create"}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
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
      acc.push({ seq: d.sequence_number, cost: prev + (d.cost_impact ?? 0) });
      return acc;
    }, []);

  const sensorData = (sensorConfigs.length > 0 ? sensorConfigs : Object.entries(SENSOR_CONFIG).map(([name, cfg]) => ({
    name, label: cfg.label, unit: cfg.unit, base_value: cfg.base, range_max: cfg.range[1], threshold_max: null as number | null,
  }))).slice(0, 6).map(cfg => {
    const sName = "name" in cfg && typeof cfg.name === "string" ? cfg.name : "";
    const reading = latest[sName];
    const baseVal = ("base_value" in cfg ? cfg.base_value : 0) ?? 0;
    const rangeMax = ("range_max" in cfg ? cfg.range_max : 100) ?? 100;
    const thresh = ("threshold_max" in cfg ? cfg.threshold_max : null) ?? reading?.threshold ?? rangeMax;
    return { name: ("label" in cfg ? cfg.label : sName) ?? sName, val: reading?.value ?? baseVal, unit: ("unit" in cfg ? cfg.unit : "") ?? "", thresh, anom: reading?.anomaly ?? false };
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

      {/* Cost trajectory — Recharts AreaChart */}
      {costData.length > 1 && (
        <div style={glass({ padding: "18px 20px", marginBottom: 20 })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: t.textSecondary, fontWeight: 500 }}>Cost Trajectory</div>
              <div style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>{activeProject?.name} &middot; {costData.length} decisions</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: costData[costData.length - 1].cost > budget ? t.neonRed : t.accent }}>
              {formatCurrency(costData[costData.length - 1].cost)}
            </div>
          </div>
          {(() => {
            const maxCost = Math.max(...costData.map(d => d.cost));
            const budgetRatio = budget > 0 ? Math.min(budget / (maxCost * 1.15), 1) : 0.8;
            // Green below 70% budget, amber at budget, red above
            const greenStop = Math.max(0, 1 - budgetRatio * 0.7);
            const amberStop = Math.max(0, 1 - budgetRatio);
            return (
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={costData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="costLineGrad" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor={t.neonGreen} />
                        <stop offset={`${greenStop * 100}%`} stopColor={t.neonGreen} />
                        <stop offset={`${amberStop * 100}%`} stopColor={t.neonAmber} />
                        <stop offset="100%" stopColor={t.neonRed} />
                      </linearGradient>
                      <linearGradient id="costAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={t.neonRed} stopOpacity={0.12} />
                        <stop offset={`${amberStop * 100}%`} stopColor={t.neonAmber} stopOpacity={0.06} />
                        <stop offset="100%" stopColor={t.neonGreen} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
                    <XAxis dataKey="seq" tick={{ fontSize: 11, fill: t.textMuted }} axisLine={false} tickLine={false} tickFormatter={(v) => `#${v}`} />
                    <YAxis tick={{ fontSize: 11, fill: t.textMuted }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} width={55} />
                    <Tooltip
                      contentStyle={{ background: t.bgElevated, border: `0.5px solid ${t.glassBorder}`, borderRadius: 10, fontSize: 12 }}
                      labelStyle={{ color: t.textMuted }}
                      formatter={(value: any) => [formatCurrency(Number(value)), "Cumulative Cost"]}
                      labelFormatter={(label) => `Decision #${label}`}
                    />
                    <ReferenceLine y={budget} stroke={t.textMuted} strokeDasharray="4 4" label={{ value: `Budget`, position: "right", fontSize: 10, fill: t.textMuted }} />
                    <Area type="monotone" dataKey="cost" stroke="url(#costLineGrad)" strokeWidth={2.5} fill="url(#costAreaGrad)"
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        const c = payload.cost > budget ? t.neonRed : payload.cost > budget * 0.7 ? t.neonAmber : t.neonGreen;
                        return <circle cx={cx} cy={cy} r={3.5} fill={c} stroke={t.bg} strokeWidth={1.5} />;
                      }}
                      activeDot={(props: any) => {
                        const { cx, cy, payload } = props;
                        const c = payload.cost > budget ? t.neonRed : payload.cost > budget * 0.7 ? t.neonAmber : t.neonGreen;
                        return <circle cx={cx} cy={cy} r={5} fill={c} stroke={t.bg} strokeWidth={2} />;
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            );
          })()}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateProject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
          <div style={glass({ maxWidth: 400, width: "90%", padding: "28px 24px" })}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, margin: "0 0 16px" }}>New Project</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>Project Name</div>
                <input value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} placeholder="e.g. EnergyConnect Phase 2"
                  style={{ width: "100%", padding: "10px 12px", background: t.bgInput, border: `0.5px solid ${t.glassBorder}`, borderRadius: 10, color: t.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>Description</div>
                <textarea value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of the project..."
                  style={{ width: "100%", padding: "10px 12px", background: t.bgInput, border: `0.5px solid ${t.glassBorder}`, borderRadius: 10, color: t.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", minHeight: 60, resize: "vertical" }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>Original Budget (AUD)</div>
                <input type="number" value={newProject.original_budget} onChange={e => setNewProject(p => ({ ...p, original_budget: e.target.value }))} placeholder="0"
                  style={{ width: "100%", padding: "10px 12px", background: t.bgInput, border: `0.5px solid ${t.glassBorder}`, borderRadius: 10, color: t.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={() => setShowCreateProject(false)} style={{ flex: 1, padding: "9px", background: "transparent", border: `0.5px solid ${t.glassBorder}`, borderRadius: 10, color: t.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={handleCreateProject} disabled={creatingProject} style={{ flex: 1, padding: "9px", background: t.accent, border: "none", borderRadius: 10, color: "#FFF", fontSize: 13, fontWeight: 500, cursor: creatingProject ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: creatingProject ? 0.6 : 1 }}>{creatingProject ? "Creating..." : "Create"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects + Sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: 16 }}>
        {/* Projects */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: t.textSecondary, fontWeight: 500 }}>Projects</span>
            <button onClick={() => setShowCreateProject(true)} style={{ fontSize: 12, color: t.accent, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>+ New Project</button>
          </div>
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
                      width: `${Math.min(Math.abs(pct), 100)}%`,
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
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
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

      {/* ── Enhanced Analytics Section ── */}
      {decisions.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {/* Decision Trend Chart — decisions per week over last 8 weeks */}
          {(() => {
            const now = new Date();
            const weeks: { label: string; start: Date; end: Date; count: number }[] = [];
            for (let i = 7; i >= 0; i--) {
              const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
              const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
              weeks.push({
                label: `W${8 - i}`,
                start,
                end,
                count: decisions.filter((d) => {
                  const dt = new Date(d.created_at);
                  return dt >= start && dt < end;
                }).length,
              });
            }
            const maxCount = Math.max(...weeks.map((w) => w.count), 1);
            const chartW = 100; // SVG viewbox percentage
            const chartH = 60;
            const padX = 8;
            const padY = 6;
            const usableW = chartW - padX * 2;
            const usableH = chartH - padY * 2;
            const points = weeks.map((w, i) => ({
              x: padX + (i / (weeks.length - 1)) * usableW,
              y: padY + usableH - (w.count / maxCount) * usableH,
              count: w.count,
              label: w.label,
            }));
            const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
            const areaPath = `M${points[0].x},${padY + usableH} ${points.map((p) => `L${p.x},${p.y}`).join(" ")} L${points[points.length - 1].x},${padY + usableH} Z`;
            return (
              <div style={glass({ padding: "18px 20px", marginBottom: 16 })}>
                <div style={{ fontSize: 12, color: t.textSecondary, fontWeight: 500, marginBottom: 14 }}>
                  Decision Trend
                  <span style={{ color: t.textMuted, fontWeight: 400, marginLeft: 8 }}>Last 8 weeks</span>
                </div>
                <svg viewBox={`0 0 ${chartW} ${chartH + 10}`} style={{ width: "100%", height: 180 }} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={t.accent} stopOpacity="0.18" />
                      <stop offset="100%" stopColor={t.accent} stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
                    <line
                      key={i}
                      x1={padX}
                      y1={padY + usableH * (1 - frac)}
                      x2={chartW - padX}
                      y2={padY + usableH * (1 - frac)}
                      stroke={t.chartGrid}
                      strokeWidth="0.3"
                    />
                  ))}
                  {/* Area fill */}
                  <path d={areaPath} fill="url(#trendFill)" />
                  {/* Line */}
                  <polyline
                    points={polyline}
                    fill="none"
                    stroke={t.accent}
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Dots + labels */}
                  {points.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="1.2" fill={t.accent} />
                      <text x={p.x} y={padY + usableH + 6} textAnchor="middle" fill={t.textMuted} fontSize="2.8" fontFamily="inherit">
                        {p.label}
                      </text>
                      {p.count > 0 && (
                        <text x={p.x} y={p.y - 2.5} textAnchor="middle" fill={t.textSecondary} fontSize="2.5" fontFamily="inherit">
                          {p.count}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              </div>
            );
          })()}

          {/* Cost Impact Summary */}
          {(() => {
            const totalCostImpact = decisions.reduce((sum, d) => sum + (d.cost_impact ?? 0), 0);
            const avgCost = decisions.length > 0 ? totalCostImpact / decisions.length : 0;
            const highestDecision = decisions.reduce<Decision | null>((max, d) =>
              !max || Math.abs(d.cost_impact ?? 0) > Math.abs(max.cost_impact ?? 0) ? d : max, null);
            return (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={glass({ padding: "16px 18px" })}>
                  <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 8, fontWeight: 500 }}>Total Cost Impact</div>
                  <div style={{
                    fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1,
                    color: totalCostImpact > 0 ? t.neonRed : totalCostImpact < 0 ? t.neonGreen : t.textPrimary,
                  }}>
                    {totalCostImpact >= 0 ? "+" : ""}{formatCurrency(totalCostImpact)}
                  </div>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 8 }}>Across {decisions.length} decisions</div>
                </div>
                <div style={glass({ padding: "16px 18px" })}>
                  <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 8, fontWeight: 500 }}>Avg Cost / Decision</div>
                  <div style={{
                    fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1,
                    color: avgCost > 0 ? t.neonAmber : t.textPrimary,
                  }}>
                    {formatCurrency(Math.abs(avgCost))}
                  </div>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 8 }}>Per decision average</div>
                </div>
                <div
                  style={glass({ padding: "16px 18px", cursor: highestDecision ? "pointer" : "default" })}
                  onClick={() => {
                    if (highestDecision && activeProjectId) {
                      navigate(`/project/${activeProjectId}/decision/${highestDecision.id}`);
                    }
                  }}
                >
                  <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 8, fontWeight: 500 }}>Highest Single Impact</div>
                  <div style={{
                    fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1,
                    color: t.neonRed,
                  }}>
                    {highestDecision ? formatCurrency(Math.abs(highestDecision.cost_impact ?? 0)) : "$0"}
                  </div>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {highestDecision ? highestDecision.title : "No decisions"}
                    {highestDecision && <span style={{ color: t.accent, marginLeft: 6 }}>&rarr;</span>}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Risk Distribution + Activity Feed row */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            {/* Risk Distribution — SVG Donut */}
            {(() => {
              const riskCounts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
              decisions.forEach((d) => {
                const r = d.risk_level || "low";
                if (r in riskCounts) riskCounts[r]++;
                else riskCounts.low++;
              });
              const total = decisions.length || 1;
              const riskEntries = [
                { level: "low", count: riskCounts.low, color: t.neonGreen },
                { level: "medium", count: riskCounts.medium, color: t.neonAmber },
                { level: "high", count: riskCounts.high, color: t.neonRed },
                { level: "critical", count: riskCounts.critical, color: "#FF2D55" },
              ].filter((e) => e.count > 0);

              const cx = 50, cy = 50, r = 38, strokeW = 10;
              const circumference = 2 * Math.PI * r;
              let offset = 0;

              return (
                <div style={glass({ padding: "18px 20px" })}>
                  <div style={{ fontSize: 12, color: t.textSecondary, fontWeight: 500, marginBottom: 14 }}>Risk Distribution</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <svg viewBox="0 0 100 100" style={{ width: 120, height: 120, flexShrink: 0 }}>
                      {/* Background ring */}
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke={t.chartGrid} strokeWidth={strokeW} />
                      {/* Segments */}
                      {riskEntries.map((entry) => {
                        const pct = entry.count / total;
                        const dashLen = pct * circumference;
                        const dashGap = circumference - dashLen;
                        const el = (
                          <circle
                            key={entry.level}
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={entry.color}
                            strokeWidth={strokeW}
                            strokeDasharray={`${dashLen} ${dashGap}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="butt"
                            transform={`rotate(-90 ${cx} ${cy})`}
                            style={{ transition: "all 0.5s ease" }}
                          />
                        );
                        offset += dashLen;
                        return el;
                      })}
                      {/* Center text */}
                      <text x={cx} y={cy - 4} textAnchor="middle" fill={t.textPrimary} fontSize="16" fontWeight="700" fontFamily="inherit">
                        {total}
                      </text>
                      <text x={cx} y={cy + 9} textAnchor="middle" fill={t.textMuted} fontSize="6" fontFamily="inherit">
                        decisions
                      </text>
                    </svg>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                      {[
                        { level: "low", color: t.neonGreen },
                        { level: "medium", color: t.neonAmber },
                        { level: "high", color: t.neonRed },
                        { level: "critical", color: "#FF2D55" },
                      ].map((entry) => (
                        <div key={entry.level} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: t.textSecondary, flex: 1, textTransform: "capitalize" }}>{entry.level}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>{riskCounts[entry.level]}</span>
                          <span style={{ fontSize: 11, color: t.textMuted, width: 36, textAlign: "right" }}>
                            {((riskCounts[entry.level] / total) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Recent Activity Feed — compact timeline */}
            <div style={glass({ padding: "18px 20px" })}>
              <div style={{ fontSize: 12, color: t.textSecondary, fontWeight: 500, marginBottom: 14 }}>Recent Activity</div>
              {decisions
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((d, i, arr) => {
                  const typeColor =
                    d.decision_type === "cost_revision" ? t.neonAmber :
                    d.decision_type === "risk_acceptance" ? t.neonRed :
                    d.decision_type === "scope_change" ? t.teal :
                    d.decision_type === "approval" ? t.neonGreen : t.accent;
                  return (
                    <div
                      key={d.id}
                      onClick={() => activeProjectId && navigate(`/project/${activeProjectId}/decision/${d.id}`)}
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: "10px 0",
                        borderBottom: i < arr.length - 1 ? `0.5px solid ${t.divider}` : "none",
                        cursor: "pointer",
                      }}
                    >
                      {/* Timeline dot + line */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 12, flexShrink: 0, paddingTop: 2 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: typeColor,
                          boxShadow: `0 0 6px ${typeColor}40`,
                        }} />
                        {i < arr.length - 1 && (
                          <div style={{ width: 1, flex: 1, background: t.divider, marginTop: 4 }} />
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{
                            fontSize: 13, fontWeight: 500, color: t.textPrimary,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                          }}>
                            {d.title}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 500, padding: "1px 6px", borderRadius: 4,
                            color: typeColor,
                            background: typeColor + "18",
                          }}>
                            {d.decision_type.replace(/_/g, " ")}
                          </span>
                          {d.cost_impact !== 0 && (
                            <span style={{
                              fontSize: 11, fontWeight: 600,
                              color: d.cost_impact > 0 ? t.neonRed : t.neonGreen,
                            }}>
                              {d.cost_impact > 0 ? "+" : ""}{formatCurrency(d.cost_impact)}
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: t.textMuted, marginLeft: "auto" }}>
                            {(() => {
                              const diff = Date.now() - new Date(d.created_at).getTime();
                              const mins = Math.floor(diff / 60000);
                              if (mins < 60) return `${mins}m ago`;
                              const hrs = Math.floor(mins / 60);
                              if (hrs < 24) return `${hrs}h ago`;
                              const days = Math.floor(hrs / 24);
                              return `${days}d ago`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {decisions.length === 0 && (
                <div style={{ fontSize: 13, color: t.textMuted, textAlign: "center", padding: 20 }}>
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
