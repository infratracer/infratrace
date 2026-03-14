import { useState } from "react";
import { useParams } from "react-router-dom";
import { exportReport } from "../api/reports";
import { useTheme } from "../hooks/useTheme";

export default function ReportsPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTheme();
  const [downloading, setDownloading] = useState(false);
  const [options, setOptions] = useState({
    include_ai: true,
    include_sensors: true,
    include_blockchain: true,
  });

  const handleExport = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      const blob = await exportReport(id, options);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `infratrace-report-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export report:", err);
    } finally {
      setDownloading(false);
    }
  };

  const toggles = [
    { key: "include_ai" as const, label: "AI Analysis Findings" },
    { key: "include_sensors" as const, label: "Sensor Data & Anomalies" },
    { key: "include_blockchain" as const, label: "Blockchain Proofs" },
  ];

  const glassCard: React.CSSProperties = {
    background: t.bgCard,
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 18,
    boxShadow: `${t.glassShadow}, ${t.glassInnerGlow}`,
    padding: "20px",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 20px",
    background: downloading ? t.accentDim : t.accent,
    border: "none",
    borderRadius: 10,
    color: "#FFF",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: downloading ? "not-allowed" : "pointer",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    opacity: downloading ? 0.7 : 1,
    boxShadow: t.btnShadow,
  };

  return (
    <div style={{ maxWidth: 512, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={glassCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18, color: t.accent }}>{"\uD83D\uDCC4"}</span>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, margin: 0 }}>
            Export Report
          </h2>
        </div>
        <p style={{ fontSize: 12, color: t.textSecondary, marginBottom: 24, marginTop: 0 }}>
          Generate a comprehensive PDF report including decision timeline, hash chain verification, and selected data sections.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {toggles.map((tog) => (
            <label
              key={tog.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 8,
                cursor: "pointer",
                transition: "background 0.15s",
                background: "transparent",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = t.bgCardHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <input
                type="checkbox"
                checked={options[tog.key]}
                onChange={() => setOptions((o) => ({ ...o, [tog.key]: !o[tog.key] }))}
                style={{ width: 16, height: 16, borderRadius: 4, accentColor: t.accent, cursor: "pointer", fontFamily: "inherit" }}
              />
              <span style={{ fontSize: 13, color: t.textPrimary }}>
                {tog.label}
              </span>
            </label>
          ))}
        </div>

        <button style={buttonStyle} onClick={handleExport} disabled={downloading}>
          {downloading ? (
            <div
              style={{
                width: 16,
                height: 16,
                border: `2px solid rgba(255,255,255,0.3)`,
                borderTop: `2px solid #FFF`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          ) : (
            <span>{"\u2B07"}</span>
          )}
          {downloading ? "Generating..." : "Download PDF Report"}
        </button>
      </div>
    </div>
  );
}
