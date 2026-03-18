import { useState } from "react";
import { useParams } from "react-router-dom";
import { exportReport } from "../api/reports";
import client from "../api/client";
import { useTheme } from "../hooks/useTheme";
import { useToastStore } from "../store/toastStore";

export default function ReportsPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTheme();
  const addToast = useToastStore((s) => s.addToast);
  const [downloading, setDownloading] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
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
      addToast("Report downloaded successfully.", "success");
    } catch (err) {
      console.error("Failed to export report:", err);
      addToast("Failed to generate report. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleExportFormat = async (format: "csv" | "json") => {
    if (!id) return;
    const setLoading = format === "csv" ? setExportingCsv : setExportingJson;
    setLoading(true);
    try {
      const res = await client.get(`/projects/${id}/export/decisions?format=${format}`, { responseType: "blob" });
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `infratrace-decisions-${id}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      addToast(`${format.toUpperCase()} exported successfully.`, "success");
    } catch (err) {
      console.error(`Failed to export ${format}:`, err);
      addToast(`Failed to export ${format.toUpperCase()}. Please try again.`, "error");
    } finally {
      setLoading(false);
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
    borderRadius: 16,
    boxShadow: `${t.glassShadow}, ${t.glassInnerGlow}`,
    padding: "20px",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 20px",
    background: downloading ? t.accentDim : t.accent,
    border: "none", borderRadius: 10, color: "#FFF", fontSize: 13,
    fontWeight: 600, fontFamily: "inherit",
    cursor: downloading ? "not-allowed" : "pointer",
    width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
    gap: 8, opacity: downloading ? 0.7 : 1, boxShadow: t.btnShadow,
  };

  return (
    <div style={{ maxWidth: 512, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={glassCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18, color: t.accent }}>{"\uD83D\uDCC4"}</span>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, margin: 0 }}>Export Report</h2>
        </div>
        <p style={{ fontSize: 12, color: t.textSecondary, marginBottom: 24, marginTop: 0 }}>
          Generate a comprehensive PDF report including decision timeline, hash chain verification, and selected data sections.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {toggles.map((tog) => (
            <label
              key={tog.key}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                transition: "background 0.15s", background: "transparent",
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
              <span style={{ fontSize: 13, color: t.textPrimary }}>{tog.label}</span>
            </label>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button style={buttonStyle} onClick={handleExport} disabled={downloading}>
            {downloading ? (
              <div style={{
                width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                borderTop: "2px solid #FFF", borderRadius: "50%", animation: "spin 1s linear infinite",
              }} />
            ) : (
              <span>{"\u2B07"}</span>
            )}
            {downloading ? "Generating..." : "Download PDF Report"}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={{
                ...buttonStyle,
                flex: 1,
                background: exportingCsv ? t.accentDim : "transparent",
                border: `1px solid ${t.glassBorder}`,
                color: t.textPrimary,
                cursor: exportingCsv ? "not-allowed" : "pointer",
                opacity: exportingCsv ? 0.7 : 1,
              }}
              onClick={() => handleExportFormat("csv")}
              disabled={exportingCsv}
            >
              {exportingCsv ? "Exporting..." : "Export CSV"}
            </button>
            <button
              style={{
                ...buttonStyle,
                flex: 1,
                background: exportingJson ? t.accentDim : "transparent",
                border: `1px solid ${t.glassBorder}`,
                color: t.textPrimary,
                cursor: exportingJson ? "not-allowed" : "pointer",
                opacity: exportingJson ? 0.7 : 1,
              }}
              onClick={() => handleExportFormat("json")}
              disabled={exportingJson}
            >
              {exportingJson ? "Exporting..." : "Export JSON"}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
