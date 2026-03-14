import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import type { SensorMessage } from "../../types";
import { SENSOR_CONFIG } from "../../utils/constants";

interface AlertStripProps {
  anomalies: SensorMessage[];
}

export default function AlertStrip({ anomalies }: AlertStripProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || anomalies.length === 0) return null;

  const latest = anomalies[anomalies.length - 1];
  const config = SENSOR_CONFIG[latest.sensor_type];

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-neon-red-dim border border-neon-red/20 mb-4 animate-fade-in">
      <AlertTriangle size={16} className="text-neon-red shrink-0" />
      <p className="flex-1 text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
        <span className="text-neon-red font-semibold">{anomalies.length} anomal{anomalies.length === 1 ? "y" : "ies"}</span>
        {" "}detected — Latest: {config.label} at {latest.value.toFixed(1)} {config.unit}
        {latest.deviation_pct && ` (${latest.deviation_pct.toFixed(0)}% above threshold)`}
      </p>
      <button onClick={() => setDismissed(true)} className="text-neon-red/60 hover:text-neon-red cursor-pointer">
        <X size={14} />
      </button>
    </div>
  );
}
