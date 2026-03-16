import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { getSensorReadings, getLatestReadings } from "../api/sensors";
import { getSensorConfigs, type SensorConfig } from "../api/projectSensors";
import { useSensorSocket } from "../hooks/useSensorSocket";
import { useSensorStore } from "../store/sensorStore";
import { SENSOR_CONFIG } from "../utils/constants";
import type { SensorReading, SensorType } from "../types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useTheme } from "../hooks/useTheme";

export default function SensorDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [sensorConfigs, setSensorConfigs] = useState<SensorConfig[]>([]);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<SensorType>("");
  const latest = useSensorStore((s) => s.latest);
  const updateReading = useSensorStore((s) => s.updateReading);
  const t = useTheme();
  const abortRef = useRef<AbortController | null>(null);

  const wsStatus = useSensorSocket(id, updateReading);

  const loadData = async () => {
    if (!id) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setLoading(true);
    try {
      // Load sensor configs from API (per-project, not hardcoded)
      const configs = await getSensorConfigs(id);
      if (controller.signal.aborted) return;
      setSensorConfigs(configs.filter(c => c.is_active));
      if (configs.length > 0 && !selectedType) {
        setSelectedType(configs[0].name);
      }

      const typeToFetch = selectedType || (configs.length > 0 ? configs[0].name : "");
      const [histData] = await Promise.all([
        typeToFetch ? getSensorReadings(id, { sensor_type: typeToFetch, limit: 100 }) : Promise.resolve([]),
        getLatestReadings(id).catch(() => []),
      ]);
      if (controller.signal.aborted) return;
      setHistory(histData);
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
      console.error("Failed to load sensor data:", err);
      setError("Failed to load sensor data. Please try again.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => abortRef.current?.abort();
  }, [id, selectedType]);

  const glassCard: React.CSSProperties = {
    background: t.bgCard,
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 16,
    boxShadow: `${t.glassShadow}, ${t.glassInnerGlow}`,
    padding: "20px",
  };

  const overline = {
    fontSize: 12, fontWeight: 500, letterSpacing: "0.01em",
    color: t.textSecondary,
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <div style={{
          width: 32, height: 32, border: `3px solid ${t.accent}`,
          borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite",
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
          <h3 style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, marginBottom: 8 }}>Failed to Load Sensors</h3>
          <p style={{ fontSize: 12, color: t.textSecondary, marginBottom: 20 }}>{error}</p>
          <button onClick={loadData} style={{
            padding: "10px 24px", background: t.accent, border: "none", borderRadius: 10,
            color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: t.btnShadow,
          }}>Retry</button>
        </div>
      </div>
    );
  }

  // Use API-loaded configs; fall back to hardcoded defaults if not loaded yet
  const types = sensorConfigs.length > 0
    ? sensorConfigs.map(c => c.name)
    : (Object.keys(SENSOR_CONFIG) as SensorType[]);
  const selectedConfig = sensorConfigs.find(c => c.name === selectedType);
  const config = selectedConfig
    ? { label: selectedConfig.label, unit: selectedConfig.unit, base: selectedConfig.base_value ?? 0, range: [selectedConfig.range_min ?? 0, selectedConfig.range_max ?? 100] as [number, number] }
    : SENSOR_CONFIG[selectedType] || { label: selectedType, unit: "", base: 0, range: [0, 100] as [number, number] };

  const chartData = history.map((r: any) => {
    const dateStr = r.recorded_at || r.created_at || "";
    const d = new Date(dateStr);
    const label = isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-AU", { day: "2-digit", month: "short" });
    return { time: label, value: r.value, anomaly: r.anomaly_flag };
  });

  const wsColorMap: Record<string, string> = {
    connected: t.neonGreen,
    connecting: t.neonAmber,
    disconnected: t.neonRed,
    error: t.neonRed,
  };

  const wsLabelMap: Record<string, string> = {
    connected: "Connected",
    connecting: "Connecting...",
    disconnected: "Disconnected",
    error: "Connection Error",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Live status bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px", borderRadius: 12,
        border: `1px solid ${t.glassBorder}`, background: t.bgCard,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: wsColorMap[wsStatus],
          boxShadow: `0 0 8px ${wsColorMap[wsStatus]}60`,
        }} />
        <span style={{ fontSize: 11, fontWeight: 500, color: t.textSecondary }}>
          Live Sensor Feed
        </span>
        <span style={{ fontSize: 10, marginLeft: "auto", color: wsColorMap[wsStatus] }}>
          {wsLabelMap[wsStatus]}
        </span>
      </div>

      {/* Sensor grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        {types.map((type) => {
          const apiCfg = sensorConfigs.find(c => c.name === type);
          const fallbackCfg = SENSOR_CONFIG[type];
          const cfg = apiCfg
            ? { label: apiCfg.label, unit: apiCfg.unit, base: apiCfg.base_value ?? 0, range: [apiCfg.range_min ?? 0, apiCfg.range_max ?? 100] as [number, number] }
            : fallbackCfg || { label: type, unit: "", base: 0, range: [0, 100] as [number, number] };
          const reading = latest[type];
          const value = reading?.value ?? cfg.base;
          const threshold = apiCfg?.threshold_max ?? reading?.threshold ?? cfg.range[1];
          const isAnomaly = reading?.anomaly ?? false;
          const isSelected = type === selectedType;
          const pct = Math.min((value / threshold) * 100, 100);

          return (
            <div
              key={type}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedType(type)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedType(type); }}
              style={{
                ...glassCard, padding: 14, cursor: "pointer",
                borderColor: isAnomaly ? t.neonRedDim : isSelected ? t.accent : t.glassBorder,
                boxShadow: isAnomaly ? `0 0 12px ${t.neonRedDim}` : isSelected ? `0 0 12px ${t.accentDim}` : `${t.glassShadow}, ${t.glassInnerGlow}`,
                transition: "border-color 200ms, box-shadow 200ms",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <p style={overline}>{cfg.label}</p>
                {isAnomaly && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: t.neonRed,
                    background: t.neonRedDim, padding: "1px 6px", borderRadius: 6,
                  }}>!</span>
                )}
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 2, color: isAnomaly ? t.neonRed : t.textPrimary }}>{value >= 100 ? Math.round(value).toLocaleString() : value.toFixed(1)}</p>
              <p style={{ fontSize: 10, marginBottom: 8, color: t.textMuted }}>{cfg.unit}</p>
              <div style={{ width: "100%", height: 4, borderRadius: 2, background: t.bgInput, overflow: "hidden" }}>
                <div style={{
                  width: `${pct}%`, height: "100%", borderRadius: 2,
                  background: pct > 90 ? t.neonRed : pct > 70 ? t.neonAmber : t.neonGreen,
                  transition: "width 300ms",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* History chart */}
      <div style={glassCard}>
        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: t.textPrimary }}>
          {config.label} — Recent Readings
        </h3>
        {chartData.length === 0 ? (
          <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: 12, color: t.textMuted }}>No sensor data available for this period.</p>
          </div>
        ) : (
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: t.textMuted }} axisLine={{ stroke: t.chartGrid }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: t.textMuted }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: t.bgElevated, border: `1px solid ${t.glassBorder}`,
                    borderRadius: 12, fontSize: 12,
                  }}
                  labelStyle={{ color: t.textMuted }}
                />
                <ReferenceLine
                  y={config.range[1]} stroke={t.neonAmber} strokeDasharray="4 4"
                  label={{ value: "Threshold", position: "right", fontSize: 10, fill: t.neonAmber }}
                />
                <Line type="monotone" dataKey="value" stroke={t.teal} strokeWidth={2} dot={false}
                  activeDot={{ r: 4, fill: t.teal, stroke: "none" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
