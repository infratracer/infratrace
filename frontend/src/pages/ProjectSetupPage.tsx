import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useIsMobile } from "../hooks/useIsMobile";
import { useToastStore } from "../store/toastStore";
import { createSensorConfig } from "../api/projectSensors";
import { createAssumption } from "../api/assumptions";

const SENSOR_TEMPLATES = [
  { name: "steel_price", label: "Steel Price", unit: "$/tonne", category: "commodity", base_value: 1000, range_min: 800, range_max: 1400, noise_factor: 50, threshold_max: 1100 },
  { name: "copper_price", label: "Copper Price", unit: "$/tonne", category: "commodity", base_value: 9000, range_min: 7500, range_max: 11000, noise_factor: 200, threshold_max: 9500 },
  { name: "labour_rate", label: "Labour Rate", unit: "$/hour", category: "labour", base_value: 82, range_min: 70, range_max: 100, noise_factor: 5, threshold_max: 92 },
  { name: "temperature", label: "Temperature", unit: "\u00b0C", category: "weather", base_value: 28, range_min: 15, range_max: 42, noise_factor: 4, threshold_max: 38 },
  { name: "rainfall", label: "Rainfall", unit: "mm/day", category: "weather", base_value: 10, range_min: 0, range_max: 50, noise_factor: 8, threshold_max: 30 },
  { name: "concrete_price", label: "Concrete Price", unit: "$/m\u00b3", category: "commodity", base_value: 250, range_min: 180, range_max: 400, noise_factor: 20, threshold_max: 300 },
  { name: "diesel_price", label: "Diesel Price", unit: "$/litre", category: "commodity", base_value: 1.8, range_min: 1.2, range_max: 2.5, noise_factor: 0.15, threshold_max: 2.2 },
  { name: "equipment_rate", label: "Equipment Rate", unit: "$/hour", category: "logistics", base_value: 450, range_min: 300, range_max: 700, noise_factor: 40, threshold_max: 550 },
];

export default function ProjectSetupPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = useTheme();
  const isMobile = useIsMobile();
  const addToast = useToastStore((s) => s.addToast);
  const [step, setStep] = useState(0);
  const [selectedSensors, setSelectedSensors] = useState<Set<string>>(new Set(["steel_price", "copper_price", "labour_rate", "temperature", "rainfall"]));
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("auditor");
  const [members, setMembers] = useState<{ email: string; role: string }[]>([]);
  const [assumptionText, setAssumptionText] = useState("");
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const glass: React.CSSProperties = {
    background: t.bgCard, backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: `1px solid ${t.glassBorder}`, borderRadius: 16, boxShadow: `${t.glassShadow}, ${t.glassInnerGlow}`, padding: "24px",
  };
  const btnPrimary: React.CSSProperties = { padding: "12px 24px", background: t.accent, border: "none", borderRadius: 12, color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: t.btnShadow };
  const btnGhost: React.CSSProperties = { padding: "12px 24px", background: "transparent", border: `1px solid ${t.glassBorder}`, borderRadius: 12, color: t.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", background: t.bgInput, border: `1px solid ${t.glassBorder}`, borderRadius: 10, color: t.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

  const steps = [
    { label: "Sensors", desc: "What should this project monitor?" },
    { label: "Team", desc: "Who's working on this project?" },
    { label: "Assumptions", desc: "What are the key assumptions?" },
    { label: "Launch", desc: "Review and start" },
  ];

  const toggleSensor = (name: string) => {
    const next = new Set(selectedSensors);
    if (next.has(name)) next.delete(name); else next.add(name);
    setSelectedSensors(next);
  };

  const addMember = () => {
    if (!memberEmail) return;
    setMembers([...members, { email: memberEmail, role: memberRole }]);
    setMemberEmail("");
  };

  const addAssumption = () => {
    if (!assumptionText) return;
    setAssumptions([...assumptions, assumptionText]);
    setAssumptionText("");
  };

  const handleFinish = async () => {
    if (!id) return;
    setSaving(true);
    try {
      // Create sensors
      for (const sensorName of selectedSensors) {
        const tmpl = SENSOR_TEMPLATES.find(s => s.name === sensorName);
        if (tmpl) {
          await createSensorConfig(id, tmpl).catch(() => {});
        }
      }

      // Create assumptions
      for (const text of assumptions) {
        await createAssumption(id, { category: "general", description: text }).catch(() => {});
      }

      addToast("Project setup complete!", "success");
      navigate(`/project/${id}/timeline`);
    } catch {
      addToast("Some setup steps failed. You can configure them later.", "info");
      navigate(`/project/${id}/timeline`);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* Step indicator */}
      <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{
              height: 3, borderRadius: 2, marginBottom: 8,
              background: i <= step ? t.accent : t.divider,
              transition: "background 0.3s",
            }} />
            <div style={{ fontSize: 11, fontWeight: i === step ? 600 : 400, color: i === step ? t.accent : t.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={glass}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: t.textPrimary, margin: "0 0 4px" }}>{steps[step].label}</h2>
        <p style={{ fontSize: 13, color: t.textSecondary, margin: "0 0 24px" }}>{steps[step].desc}</p>

        {/* Step 0: Sensors */}
        {step === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
            {SENSOR_TEMPLATES.map((s) => {
              const selected = selectedSensors.has(s.name);
              return (
                <div key={s.name} onClick={() => toggleSensor(s.name)}
                  style={{
                    padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                    border: `1px solid ${selected ? t.accent : t.glassBorder}`,
                    background: selected ? t.accentDim : "transparent",
                    transition: "all 0.2s",
                  }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: selected ? t.accent : t.textPrimary }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: t.textMuted }}>{s.unit} &middot; {s.category}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Step 1: Team */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: isMobile ? "wrap" : "nowrap" }}>
              <input style={{ ...inputStyle, flex: isMobile ? "1 1 100%" : 1 }} placeholder="user@example.com" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} />
              <select style={{ ...inputStyle, width: "auto", flex: isMobile ? "1 1 auto" : "none" }} value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                <option value="pm">Project Manager</option>
                <option value="auditor">Auditor</option>
                <option value="stakeholder">Stakeholder</option>
              </select>
              <button style={{ ...btnPrimary, padding: "10px 16px", fontSize: 12 }} onClick={addMember}>Add</button>
            </div>
            {members.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {members.map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: t.bgInput, borderRadius: 8 }}>
                    <span style={{ fontSize: 12, color: t.textPrimary }}>{m.email}</span>
                    <span style={{ fontSize: 11, color: t.textMuted }}>{m.role}</span>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: 11, color: t.textMuted }}>You can also add team members later from the project settings.</p>
          </div>
        )}

        {/* Step 2: Assumptions */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="e.g., Steel costs will not exceed $1,100/tonne" value={assumptionText} onChange={(e) => setAssumptionText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addAssumption(); }} />
              <button style={{ ...btnPrimary, padding: "10px 16px", fontSize: 12 }} onClick={addAssumption}>Add</button>
            </div>
            {assumptions.map((a, i) => (
              <div key={i} style={{ padding: "8px 12px", background: t.bgInput, borderRadius: 8, fontSize: 12, color: t.textPrimary }}>{a}</div>
            ))}
            <p style={{ fontSize: 11, color: t.textMuted }}>Assumptions can be linked to sensors and thresholds later.</p>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 4 }}>Sensors ({selectedSensors.size})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {[...selectedSensors].map(s => {
                  const tmpl = SENSOR_TEMPLATES.find(t => t.name === s);
                  return <span key={s} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: t.accentDim, color: t.accent }}>{tmpl?.label || s}</span>;
                })}
              </div>
            </div>
            {members.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 4 }}>Team ({members.length})</div>
                {members.map((m, i) => <div key={i} style={{ fontSize: 12, color: t.textPrimary }}>{m.email} ({m.role})</div>)}
              </div>
            )}
            {assumptions.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 4 }}>Assumptions ({assumptions.length})</div>
                {assumptions.map((a, i) => <div key={i} style={{ fontSize: 12, color: t.textPrimary }}>{a}</div>)}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button style={btnGhost} onClick={() => step > 0 ? setStep(step - 1) : navigate(`/project/${id}/timeline`)}>
            {step > 0 ? "Back" : "Skip Setup"}
          </button>
          {step < 3 ? (
            <button style={btnPrimary} onClick={() => setStep(step + 1)}>Next</button>
          ) : (
            <button style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={handleFinish} disabled={saving}>
              {saving ? "Setting up..." : "Launch Project"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
