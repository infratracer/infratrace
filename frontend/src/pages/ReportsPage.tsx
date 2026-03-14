import { useState } from "react";
import { useParams } from "react-router-dom";
import { exportReport } from "../api/reports";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import { FileText, Download } from "lucide-react";

export default function ReportsPage() {
  const { id } = useParams<{ id: string }>();
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

  return (
    <div className="max-w-lg animate-fade-in space-y-6">
      <GlassCard padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-accent" />
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Export Report
          </h2>
        </div>
        <p className="text-[12px] mb-6" style={{ color: "var(--text-secondary)" }}>
          Generate a comprehensive PDF report including decision timeline, hash chain verification, and selected data sections.
        </p>

        <div className="space-y-3 mb-6">
          {toggles.map((t) => (
            <label
              key={t.key}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-glass-border"
            >
              <input
                type="checkbox"
                checked={options[t.key]}
                onChange={() => setOptions((o) => ({ ...o, [t.key]: !o[t.key] }))}
                className="w-4 h-4 rounded accent-accent"
              />
              <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                {t.label}
              </span>
            </label>
          ))}
        </div>

        <Button onClick={handleExport} loading={downloading} size="lg" className="w-full">
          <Download size={16} /> Download PDF Report
        </Button>
      </GlassCard>
    </div>
  );
}
