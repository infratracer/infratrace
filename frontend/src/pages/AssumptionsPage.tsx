import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAssumptions, createAssumption, updateAssumption } from "../api/assumptions";
import { useTheme } from "../hooks/useTheme";
import { SENSOR_CONFIG } from "../utils/constants";
import { formatDate } from "../utils/format";
import type { Assumption, SensorType } from "../types";

export default function AssumptionsPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTheme();
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ category: "", description: "", sensor_type: "", threshold_value: "", threshold_unit: "" });

  const loadData = async () => {
    if (!id) return;
    try {
      const data = await getAssumptions(id);
      setAssumptions(data);
    } catch (err) {
      console.error("Failed to load assumptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleCreate = async () => {
    if (!id) return;
    try {
      await createAssumption(id, {
        category: formData.category,
        description: formData.description,
        sensor_type: formData.sensor_type || undefined,
        threshold_value: formData.threshold_value ? parseFloat(formData.threshold_value) : undefined,
        threshold_unit: formData.threshold_unit || undefined,
      });
      setShowForm(false);
      setFormData({ category: "", description: "", sensor_type: "", threshold_value: "", threshold_unit: "" });
      loadData();
    } catch (err) {
      console.error("Failed to create assumption:", err);
    }
  };

  const handleStatusChange = async (assumption: Assumption, status: string) => {
    if (!id) return;
    try {
      await updateAssumption(id, assumption.id, { status });
      loadData();
    } catch (err) {
      console.error("Failed to update assumption:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: `3px solid ${t.glassBorder}`,
            borderTop: `3px solid ${t.accent}`,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  const sensorOptions = Object.entries(SENSOR_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  }));

  const statusBadgeStyle = (status: string): React.CSSProperties => {
    let bg: string;
    let color: string;
    if (status === "validated") {
      bg = t.neonGreenDim;
      color = t.neonGreen;
    } else if (status === "invalidated") {
      bg = t.neonRedDim;
      color = t.neonRed;
    } else {
      bg = t.neonAmberDim;
      color = t.neonAmber;
    }
    return {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 600,
      background: bg,
      color,
    };
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: t.bgInput,
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 10,
    color: t.textPrimary,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  };

  const selectStyle: React.CSSProperties = { ...inputStyle };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 20px",
    background: t.accent,
    border: "none",
    borderRadius: 10,
    color: "#FFF",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: t.btnShadow,
  };

  const buttonSmStyle: React.CSSProperties = {
    padding: "6px 12px",
    background: t.accent,
    border: "none",
    borderRadius: 8,
    color: "#FFF",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  const ghostBtnStyle: React.CSSProperties = {
    padding: "6px 12px",
    background: "transparent",
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 8,
    color: t.textSecondary,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  const glassCard: React.CSSProperties = {
    background: t.bgCard,
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 18,
    boxShadow: `${t.glassShadow}, ${t.glassInnerGlow}`,
    padding: "20px",
  };

  const overlineLabel: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: t.textMuted,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: t.textSecondary }}>
          {assumptions.length} assumption{assumptions.length !== 1 ? "s" : ""}
        </span>
        <button style={buttonSmStyle} onClick={() => setShowForm(!showForm)}>
          {showForm ? "\u2715 Cancel" : "\u002B Add Assumption"}
        </button>
      </div>

      {showForm && (
        <div style={glassCard}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={overlineLabel}>Category</label>
              <input
                style={inputStyle}
                value={formData.category}
                onChange={(e) => setFormData((d) => ({ ...d, category: e.target.value }))}
                placeholder="e.g., Material Cost, Weather, Labour"
              />
            </div>
            <div>
              <label style={overlineLabel}>Description</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" as const }}
                value={formData.description}
                onChange={(e) => setFormData((d) => ({ ...d, description: e.target.value }))}
                placeholder="Describe the assumption..."
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={overlineLabel}>Sensor Type</label>
                <select
                  style={selectStyle}
                  value={formData.sensor_type}
                  onChange={(e) => setFormData((d) => ({ ...d, sensor_type: e.target.value }))}
                >
                  <option value="">Select...</option>
                  {sensorOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={overlineLabel}>Threshold</label>
                <input
                  style={inputStyle}
                  type="number"
                  value={formData.threshold_value}
                  onChange={(e) => setFormData((d) => ({ ...d, threshold_value: e.target.value }))}
                />
              </div>
              <div>
                <label style={overlineLabel}>Unit</label>
                <input
                  style={inputStyle}
                  value={formData.threshold_unit}
                  onChange={(e) => setFormData((d) => ({ ...d, threshold_unit: e.target.value }))}
                  placeholder={formData.sensor_type ? SENSOR_CONFIG[formData.sensor_type as SensorType]?.unit : ""}
                />
              </div>
            </div>
            <button style={buttonStyle} onClick={handleCreate}>Save Assumption</button>
          </div>
        </div>
      )}

      {assumptions.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, color: t.textMuted }}>
          <span style={{ fontSize: 32, marginBottom: 12 }}>{"\u2630"}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, marginBottom: 4 }}>No assumptions</span>
          <span style={{ fontSize: 12, color: t.textMuted }}>Add assumptions to monitor with IoT sensors.</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {assumptions.map((a) => (
            <div key={a.id} style={glassCard}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={statusBadgeStyle(a.status)}>{a.status}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: t.textMuted }}>
                      {a.category}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: t.textPrimary, margin: 0 }}>
                    {a.description}
                  </p>
                  {a.sensor_type && a.threshold_value && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 11, color: t.textSecondary }}>
                        {SENSOR_CONFIG[a.sensor_type]?.label}: ≤ {a.threshold_value} {a.threshold_unit}
                      </span>
                      <div style={{ width: 128, height: 6, background: t.bgInput, borderRadius: 3, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(100, ((SENSOR_CONFIG[a.sensor_type]?.base ?? 0) / a.threshold_value) * 100)}%`,
                            background: (SENSOR_CONFIG[a.sensor_type]?.base ?? 0) > a.threshold_value ? t.neonRed : t.neonGreen,
                            borderRadius: 3,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <p style={{ fontSize: 10, marginTop: 8, marginBottom: 0, color: t.textMuted }}>
                    Created {formatDate(a.created_at)}
                  </p>
                </div>
                {a.status === "active" && (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button style={ghostBtnStyle} onClick={() => handleStatusChange(a, "validated")}>
                      Validate
                    </button>
                    <button style={ghostBtnStyle} onClick={() => handleStatusChange(a, "invalidated")}>
                      Invalidate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
