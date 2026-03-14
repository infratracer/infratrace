import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSensorReadings, getLatestReadings } from "../api/sensors";
import { useSensorSocket } from "../hooks/useSensorSocket";
import { useSensorStore } from "../store/sensorStore";
import { SENSOR_CONFIG } from "../utils/constants";
import type { SensorReading, SensorType } from "../types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useTheme } from "../hooks/useTheme";

export default function SensorDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<SensorType>("steel_price");
  const latest = useSensorStore((s) => s.latest);
  const updateReading = useSensorStore((s) => s.updateReading);
  const t = useTheme();

  useSensorSocket(id, updateReading);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [histData] = await Promise.all([
          getSensorReadings(id, { sensor_type: selectedType, limit: 100 }),
          getLatestReadings(id).catch(() => []),
        ]);
        setHistory(histData);
      } catch (err) {
        console.error("Failed to load sensor data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, selectedType]);

  const glassCard = {
    background: t.bgCard,
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 18,
    boxShadow: `${t.glassShadow}, ${t.glassInnerGlow}`,
    padding: "20px",
  };

  const overline = {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: t.textMuted,
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: `3px solid ${t.accent}`,
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const types = Object.keys(SENSOR_CONFIG) as SensorType[];
  const config = SENSOR_CONFIG[selectedType];

  const chartData = history.map((r) => ({
    time: new Date(r.recorded_at).toLocaleDateString("en-AU", { day: "2-digit", month: "short" }),
    value: r.value,
    anomaly: r.anomaly_flag,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Live status bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 12,
          border: `1px solid ${t.glassBorder}`,
          background: t.bgCard,
        }}
      >
        <span style={{ fontSize: 14, color: t.neonGreen }}>{"📡"}</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: t.textSecondary }}>
          Live Sensor Feed
        </span>
        <span style={{ fontSize: 10, marginLeft: "auto", color: t.textMuted }}>
          WebSocket connected
        </span>
      </div>

      {/* Sensor grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        {types.map((type) => {
          const cfg = SENSOR_CONFIG[type];
          const reading = latest[type];
          const value = reading?.value ?? cfg.base;
          const threshold = reading?.threshold ?? cfg.range[1];
          const isAnomaly = reading?.anomaly ?? false;
          const isSelected = type === selectedType;

          const pct = Math.min((value / threshold) * 100, 100);

          return (
            <div
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                ...glassCard,
                padding: 14,
                cursor: "pointer",
                borderColor: isAnomaly
                  ? t.neonRedDim
                  : isSelected
                  ? t.accent
                  : t.glassBorder,
                boxShadow: isAnomaly
                  ? `0 0 12px ${t.neonRedDim}`
                  : isSelected
                  ? `0 0 12px ${t.accentDim}`
                  : `${t.glassShadow}, ${t.glassInnerGlow}`,
                transition: "border-color 200ms, box-shadow 200ms",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <p style={overline}>{cfg.label}</p>
                {isAnomaly && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: t.neonRed,
                      background: t.neonRedDim,
                      padding: "1px 6px",
                      borderRadius: 6,
                    }}
                  >
                    !
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 2,
                  color: isAnomaly ? t.neonRed : t.textPrimary,
                }}
              >
                {value.toFixed(1)}
              </p>
              <p style={{ fontSize: 10, marginBottom: 8, color: t.textMuted }}>
                {cfg.unit}
              </p>
              {/* Inline threshold bar */}
              <div
                style={{
                  width: "100%",
                  height: 4,
                  borderRadius: 2,
                  background: t.bgInput,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    borderRadius: 2,
                    background: pct > 90 ? t.neonRed : pct > 70 ? t.neonAmber : t.neonGreen,
                    transition: "width 300ms",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* History chart */}
      <div style={glassCard}>
        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: t.textPrimary }}>
          {config.label} — 30 Day History
        </h3>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: t.textMuted }}
                axisLine={{ stroke: t.chartGrid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: t.textMuted }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: t.bgElevated,
                  border: `1px solid ${t.glassBorder}`,
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: t.textMuted }}
              />
              <ReferenceLine
                y={config.range[1]}
                stroke={t.neonAmber}
                strokeDasharray="4 4"
                label={{ value: "Threshold", position: "right", fontSize: 10, fill: t.neonAmber }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={t.teal}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: t.teal, stroke: "none" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
