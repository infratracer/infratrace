import { useEffect, useState, useRef } from "react";
import { getAuditLog } from "../api/admin";
import { useTheme } from "../hooks/useTheme";
import { useToastStore } from "../store/toastStore";
import { formatDateTime } from "../utils/format";
import type { AuditLogEntry } from "../types";

export default function AuditLogPage() {
  const t = useTheme();
  const addToast = useToastStore((s) => s.addToast);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const abortRef = useRef<AbortController | null>(null);

  const loadData = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setLoading(true);
    try {
      const data = await getAuditLog({ page, per_page: 50 });
      if (controller.signal.aborted) return;
      setLogs(data);
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
      console.error("Failed to load audit log:", err);
      setError("Failed to load audit log.");
      addToast("Failed to load audit log.", "error");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => abortRef.current?.abort();
  }, [page]);

  const glassCard: React.CSSProperties = {
    background: t.bgCard,
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 16,
    boxShadow: `${t.glassShadow}, ${t.glassInnerGlow}`,
    padding: "20px",
  };

  const thStyle: React.CSSProperties = {
    textAlign: "left" as const, padding: "8px 12px", fontSize: 10,
    textTransform: "uppercase" as const, letterSpacing: "0.08em",
    fontWeight: 600, color: t.textMuted,
  };

  const tdStyle: React.CSSProperties = { padding: "8px 12px" };

  const pageBtnStyle = (disabled: boolean): React.CSSProperties => ({
    padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 500,
    border: `1px solid ${t.glassBorder}`, background: "transparent",
    color: t.textSecondary, cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.3 : 1, fontFamily: "inherit",
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${t.glassBorder}`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 256 }}>
        <div style={{ ...glassCard, maxWidth: 420, width: "100%", textAlign: "center", padding: "40px 32px" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>!</div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, marginBottom: 8 }}>Failed to Load Audit Log</h3>
          <p style={{ fontSize: 12, color: t.textSecondary, marginBottom: 20 }}>{error}</p>
          <button onClick={loadData} style={{
            padding: "10px 24px", background: t.accent, border: "none", borderRadius: 10,
            color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: t.btnShadow,
          }}>Retry</button>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, color: t.textMuted }}>
        <span style={{ fontSize: 32, marginBottom: 8 }}>{"\uD83D\uDCDC"}</span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>No audit log entries</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ ...glassCard, padding: "12px" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Resource</th>
                <th style={thStyle}>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log.id} style={{ borderTop: idx > 0 ? `1px solid ${t.divider}` : "none" }}>
                  <td style={{ ...tdStyle, fontFamily: "monospace", color: t.textMuted }}>{formatDateTime(log.created_at)}</td>
                  <td style={{ ...tdStyle, color: t.textPrimary }}>{log.action}</td>
                  <td style={{ ...tdStyle, color: t.textSecondary }}>
                    {log.resource_type}
                    {log.resource_id && (
                      <span style={{ fontFamily: "monospace", fontSize: 10, marginLeft: 4, color: t.textMuted }}>{log.resource_id.slice(0, 8)}</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: "monospace", color: t.textMuted }}>{log.ip_address || "\u2014"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={pageBtnStyle(page <= 1)}>Previous</button>
        <span style={{ padding: "6px 12px", fontSize: 11, color: t.textMuted }}>Page {page}</span>
        <button disabled={logs.length < 50} onClick={() => setPage((p) => p + 1)} style={pageBtnStyle(logs.length < 50)}>Next</button>
      </div>
    </div>
  );
}
