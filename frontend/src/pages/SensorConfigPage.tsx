import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSensorConfigs, createSensorConfig, updateSensorConfig, deleteSensorConfig, type SensorConfig } from "../api/projectSensors";
import { useTheme } from "../hooks/useTheme";
import { useIsMobile } from "../hooks/useIsMobile";
import { useToastStore } from "../store/toastStore";

const DATA_SOURCE_OPTIONS = [
  { value: "simulator", label: "Simulator (demo data)" },
  { value: "api", label: "Live API feed" },
  { value: "manual", label: "Manual entry" },
];

const CATEGORY_OPTIONS = [
  { value: "commodity", label: "Commodity Price" },
  { value: "weather", label: "Weather" },
  { value: "labour", label: "Labour" },
  { value: "logistics", label: "Logistics" },
  { value: "environmental", label: "Environmental" },
  { value: "custom", label: "Custom" },
];

const EMPTY_FORM = {
  name: "", label: "", unit: "", category: "commodity",
  data_source: "simulator", provider: "",
  threshold_max: "", warning_threshold: "",
  base_value: "", range_min: "", range_max: "", noise_factor: "",
  source_city: "", source_field: "main.temp",
  source_base: "USD", source_symbol: "", source_multiplier: "1",
  source_from: "USD", source_to: "AUD",
};

export default function SensorConfigPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTheme();
  const isMobile = useIsMobile();
  const addToast = useToastStore((s) => s.addToast);
  const [configs, setConfigs] = useState<SensorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      const data = await getSensorConfigs(id);
      setConfigs(data);
    } catch { addToast("Failed to load sensor configs.", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleCreate = async () => {
    if (!id || !form.name || !form.label || !form.unit) {
      addToast("Name, label, and unit are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const sourceConfig: Record<string, unknown> = {};
      if (form.data_source === "api") {
        if (form.provider === "openweathermap") {
          sourceConfig.provider = "openweathermap";
          sourceConfig.city = form.source_city || "Perth,AU";
          sourceConfig.field = form.source_field || "main.temp";
        } else if (form.provider === "metalpriceapi") {
          sourceConfig.provider = "metalpriceapi";
          sourceConfig.base = form.source_base || "USD";
          sourceConfig.symbol = form.source_symbol;
          sourceConfig.multiplier = parseFloat(form.source_multiplier) || 1;
        } else if (form.provider === "exchangerate") {
          sourceConfig.provider = "exchangerate";
          sourceConfig.from = form.source_from || "USD";
          sourceConfig.to = form.source_to || "AUD";
        }
      }

      await createSensorConfig(id, {
        name: form.name.toLowerCase().replace(/\s+/g, "_"),
        label: form.label,
        unit: form.unit,
        category: form.category || undefined,
        data_source: form.data_source,
        source_config: Object.keys(sourceConfig).length > 0 ? sourceConfig : undefined,
        threshold_max: form.threshold_max ? parseFloat(form.threshold_max) : undefined,
        warning_threshold: form.warning_threshold ? parseFloat(form.warning_threshold) : undefined,
        base_value: form.base_value ? parseFloat(form.base_value) : undefined,
        range_min: form.range_min ? parseFloat(form.range_min) : undefined,
        range_max: form.range_max ? parseFloat(form.range_max) : undefined,
        noise_factor: form.noise_factor ? parseFloat(form.noise_factor) : undefined,
      });
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      addToast("Sensor created.", "success");
      loadData();
    } catch (err: any) {
      addToast(err.response?.data?.detail || "Failed to create sensor.", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (sensor: SensorConfig) => {
    if (!id) return;
    try {
      await deleteSensorConfig(id, sensor.id);
      addToast("Sensor deleted.", "success");
      loadData();
    } catch { addToast("Failed to delete sensor.", "error"); }
  };

  const handleToggleActive = async (sensor: SensorConfig) => {
    if (!id) return;
    try {
      await updateSensorConfig(id, sensor.id, { is_active: !sensor.is_active });
      addToast(`Sensor ${!sensor.is_active ? "enabled" : "disabled"}.`, "success");
      loadData();
    } catch { addToast("Failed to update sensor.", "error"); }
  };

  const glass: React.CSSProperties = {
    background: t.bgCard, backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: `1px solid ${t.glassBorder}`, borderRadius: 16, boxShadow: `${t.glassShadow}, ${t.glassInnerGlow}`, padding: "20px",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", background: t.bgInput, border: `1px solid ${t.glassBorder}`,
    borderRadius: 10, color: t.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };
  const overline: React.CSSProperties = { fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: t.textMuted, marginBottom: 4 };
  const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: t.accent, border: "none", borderRadius: 10, color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: t.btnShadow };
  const btnGhost: React.CSSProperties = { padding: "6px 12px", background: "transparent", border: `1px solid ${t.glassBorder}`, borderRadius: 8, color: t.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <div style={{ width: 28, height: 28, border: `2.5px solid ${t.glassBorder}`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 768 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, margin: 0 }}>Sensor Configuration</h3>
          <p style={{ fontSize: 13, color: t.textSecondary, margin: "4px 0 0" }}>Configure data sources, thresholds, and monitoring for this project</p>
        </div>
        <button style={{ ...btnPrimary, fontSize: 12 }} onClick={() => setShowForm(!showForm)}>
          {showForm ? "\u2715 Cancel" : "+ Add Sensor"}
        </button>
      </div>

      {showForm && (
        <div style={glass}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
              <div><div style={overline}>Label</div><input style={inputStyle} value={form.label} onChange={(e) => setForm(f => ({ ...f, label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, "_") }))} placeholder="Steel Price" /></div>
              <div><div style={overline}>Unit</div><input style={inputStyle} value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="$/tonne" /></div>
              <div><div style={overline}>Category</div>
                <select style={inputStyle} value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <div><div style={overline}>Data Source</div>
                <select style={inputStyle} value={form.data_source} onChange={(e) => setForm(f => ({ ...f, data_source: e.target.value }))}>
                  {DATA_SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {form.data_source === "api" && (
                <div><div style={overline}>API Provider</div>
                  <select style={inputStyle} value={form.provider} onChange={(e) => setForm(f => ({ ...f, provider: e.target.value }))}>
                    <option value="">Select...</option>
                    <option value="openweathermap">OpenWeatherMap (weather)</option>
                    <option value="metalpriceapi">MetalpriceAPI (commodities)</option>
                    <option value="exchangerate">Exchange Rate (currency)</option>
                  </select>
                </div>
              )}
            </div>

            {form.data_source === "api" && form.provider === "openweathermap" && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div><div style={overline}>City</div><input style={inputStyle} value={form.source_city} onChange={(e) => setForm(f => ({ ...f, source_city: e.target.value }))} placeholder="Perth,AU" /></div>
                <div><div style={overline}>Field</div>
                  <select style={inputStyle} value={form.source_field} onChange={(e) => setForm(f => ({ ...f, source_field: e.target.value }))}>
                    <option value="main.temp">Temperature</option>
                    <option value="main.humidity">Humidity</option>
                    <option value="rain.1h">Rainfall (1h)</option>
                    <option value="wind.speed">Wind Speed</option>
                  </select>
                </div>
              </div>
            )}

            {form.data_source === "api" && form.provider === "metalpriceapi" && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
                <div><div style={overline}>Base Currency</div><input style={inputStyle} value={form.source_base} onChange={(e) => setForm(f => ({ ...f, source_base: e.target.value }))} /></div>
                <div><div style={overline}>Metal Symbol</div><input style={inputStyle} value={form.source_symbol} onChange={(e) => setForm(f => ({ ...f, source_symbol: e.target.value }))} placeholder="CU, FE, AL" /></div>
                <div><div style={overline}>Multiplier</div><input style={inputStyle} type="number" value={form.source_multiplier} onChange={(e) => setForm(f => ({ ...f, source_multiplier: e.target.value }))} /></div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 12 }}>
              <div><div style={overline}>Base Value</div><input style={inputStyle} type="number" value={form.base_value} onChange={(e) => setForm(f => ({ ...f, base_value: e.target.value }))} placeholder="1000" /></div>
              <div><div style={overline}>Range Min</div><input style={inputStyle} type="number" value={form.range_min} onChange={(e) => setForm(f => ({ ...f, range_min: e.target.value }))} /></div>
              <div><div style={overline}>Range Max</div><input style={inputStyle} type="number" value={form.range_max} onChange={(e) => setForm(f => ({ ...f, range_max: e.target.value }))} /></div>
              <div><div style={overline}>Noise</div><input style={inputStyle} type="number" value={form.noise_factor} onChange={(e) => setForm(f => ({ ...f, noise_factor: e.target.value }))} /></div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <div><div style={overline}>Warning Threshold</div><input style={inputStyle} type="number" value={form.warning_threshold} onChange={(e) => setForm(f => ({ ...f, warning_threshold: e.target.value }))} /></div>
              <div><div style={overline}>Alert Threshold (max)</div><input style={inputStyle} type="number" value={form.threshold_max} onChange={(e) => setForm(f => ({ ...f, threshold_max: e.target.value }))} /></div>
            </div>

            <button style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "Create Sensor"}
            </button>
          </div>
        </div>
      )}

      {configs.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 48, color: t.textMuted }}>
          <span style={{ fontSize: 32, marginBottom: 8 }}>&#9673;</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary }}>No sensors configured</span>
          <span style={{ fontSize: 12, marginTop: 4 }}>Add sensors to monitor real-world conditions for this project.</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {configs.map((s) => (
            <div key={s.id} style={{ ...glass, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: s.is_active ? t.accentDim : t.bgInput, color: s.is_active ? t.accent : t.textMuted,
                  fontSize: 14, fontWeight: 700,
                }}>
                  {s.category === "weather" ? "🌤" : s.category === "commodity" ? "📊" : s.category === "labour" ? "👷" : "📡"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: t.textPrimary }}>{s.label}</span>
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 6, background: s.data_source === "api" ? t.neonGreenDim : t.bgElevated, color: s.data_source === "api" ? t.neonGreen : t.textMuted, fontWeight: 600 }}>
                      {s.data_source}
                    </span>
                    {!s.is_active && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 6, background: t.neonRedDim, color: t.neonRed, fontWeight: 600 }}>disabled</span>}
                  </div>
                  <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
                    {s.unit} &middot; threshold: {s.threshold_max ?? "none"} &middot; base: {s.base_value ?? "—"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button style={btnGhost} onClick={() => handleToggleActive(s)}>{s.is_active ? "Disable" : "Enable"}</button>
                  <button style={{ ...btnGhost, color: t.neonRed, borderColor: t.neonRedDim }} onClick={() => handleDelete(s)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
