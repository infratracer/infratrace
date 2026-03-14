import GlassCard from "../ui/GlassCard";
import ThresholdBar from "../ui/ThresholdBar";
import { SENSOR_CONFIG } from "../../utils/constants";
import type { SensorMessage, SensorType } from "../../types";

interface SensorMiniGridProps {
  latest: Partial<Record<SensorType, SensorMessage>>;
}

export default function SensorMiniGrid({ latest }: SensorMiniGridProps) {
  const types = Object.keys(SENSOR_CONFIG) as SensorType[];

  return (
    <div className="space-y-3">
      <h2
        className="text-[9px] uppercase tracking-widest font-semibold"
        style={{ color: "var(--text-muted)" }}
      >
        Live Sensors
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {types.map((type) => {
          const config = SENSOR_CONFIG[type];
          const reading = latest[type];
          const value = reading?.value ?? config.base;
          const threshold = reading?.threshold ?? config.range[1];
          const isAnomaly = reading?.anomaly ?? false;

          return (
            <GlassCard
              key={type}
              padding="sm"
              glow={isAnomaly ? "red" : undefined}
              className={isAnomaly ? "border-neon-red/30" : ""}
            >
              <p
                className="text-[9px] uppercase tracking-widest font-semibold mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                {config.label}
              </p>
              <p
                className="text-[17px] font-bold mb-1"
                style={{ color: isAnomaly ? "#FF3366" : "var(--text-primary)" }}
              >
                {value.toFixed(1)}
              </p>
              <p className="text-[10px] mb-2" style={{ color: "var(--text-muted)" }}>
                {config.unit}
              </p>
              <ThresholdBar value={value} threshold={threshold} />
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
