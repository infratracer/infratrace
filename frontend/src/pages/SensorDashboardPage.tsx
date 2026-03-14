import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSensorReadings, getLatestReadings } from "../api/sensors";
import { useSensorSocket } from "../hooks/useSensorSocket";
import { useSensorStore } from "../store/sensorStore";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";
import ThresholdBar from "../components/ui/ThresholdBar";
import Spinner from "../components/ui/Spinner";
import { SENSOR_CONFIG } from "../utils/constants";
import type { SensorReading, SensorType } from "../types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Radio } from "lucide-react";

export default function SensorDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<SensorType>("steel_price");
  const latest = useSensorStore((s) => s.latest);
  const updateReading = useSensorStore((s) => s.updateReading);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={32} className="text-accent" />
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
    <div className="space-y-6 animate-fade-in">
      {/* Live status bar */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-glass-border" style={{ backgroundColor: "var(--bg-card)" }}>
        <Radio size={14} className="text-neon-green animate-pulse-glow" />
        <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
          Live Sensor Feed
        </span>
        <span className="text-[10px] ml-auto" style={{ color: "var(--text-muted)" }}>
          WebSocket connected
        </span>
      </div>

      {/* Sensor grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {types.map((type) => {
          const cfg = SENSOR_CONFIG[type];
          const reading = latest[type];
          const value = reading?.value ?? cfg.base;
          const threshold = reading?.threshold ?? cfg.range[1];
          const isAnomaly = reading?.anomaly ?? false;
          const isSelected = type === selectedType;

          return (
            <GlassCard
              key={type}
              hover
              onClick={() => setSelectedType(type)}
              padding="sm"
              glow={isAnomaly ? "red" : isSelected ? "accent" : undefined}
              className={`cursor-pointer ${isSelected ? "border-accent/40" : ""} ${isAnomaly ? "border-neon-red/30" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>
                  {cfg.label}
                </p>
                {isAnomaly && <Badge variant="sensor-anomaly">!</Badge>}
              </div>
              <p
                className="text-[20px] font-bold mb-0.5"
                style={{ color: isAnomaly ? "#FF3366" : "var(--text-primary)" }}
              >
                {value.toFixed(1)}
              </p>
              <p className="text-[10px] mb-2" style={{ color: "var(--text-muted)" }}>
                {cfg.unit}
              </p>
              <ThresholdBar value={value} threshold={threshold} />
            </GlassCard>
          );
        })}
      </div>

      {/* History chart */}
      <GlassCard padding="md">
        <h3 className="text-[13px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          {config.label} — 30 Day History
        </h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                axisLine={{ stroke: "var(--color-chart-grid)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--color-glass-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--text-muted)" }}
              />
              <ReferenceLine
                y={config.range[1]}
                stroke="#FFB800"
                strokeDasharray="4 4"
                label={{ value: "Threshold", position: "right", fontSize: 10, fill: "#FFB800" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#00D4AA"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#00D4AA", stroke: "none" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
