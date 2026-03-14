import { useEffect, useState } from "react";
import { getAuditLog } from "../api/admin";
import GlassCard from "../components/ui/GlassCard";
import Spinner from "../components/ui/Spinner";
import { formatDateTime } from "../utils/format";
import { ScrollText } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import type { AuditLogEntry } from "../types";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAuditLog({ page, per_page: 50 });
        setLogs(data);
      } catch (err) {
        console.error("Failed to load audit log:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={32} className="text-accent" />
      </div>
    );
  }

  if (logs.length === 0) {
    return <EmptyState icon={ScrollText} title="No audit log entries" />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <GlassCard padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ color: "var(--text-muted)" }}>
                <th className="text-left py-2 px-3 text-[10px] uppercase tracking-wider font-semibold">Time</th>
                <th className="text-left py-2 px-3 text-[10px] uppercase tracking-wider font-semibold">Action</th>
                <th className="text-left py-2 px-3 text-[10px] uppercase tracking-wider font-semibold">Resource</th>
                <th className="text-left py-2 px-3 text-[10px] uppercase tracking-wider font-semibold hidden md:table-cell">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--color-divider)" }}>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2 px-3 font-mono" style={{ color: "var(--text-muted)" }}>
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="py-2 px-3" style={{ color: "var(--text-primary)" }}>
                    {log.action}
                  </td>
                  <td className="py-2 px-3" style={{ color: "var(--text-secondary)" }}>
                    {log.resource_type}
                    {log.resource_id && (
                      <span className="font-mono text-[10px] ml-1" style={{ color: "var(--text-muted)" }}>
                        {log.resource_id.slice(0, 8)}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-mono hidden md:table-cell" style={{ color: "var(--text-muted)" }}>
                    {log.ip_address || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="flex justify-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1.5 rounded-lg text-[11px] font-medium border border-glass-border disabled:opacity-30 cursor-pointer"
          style={{ color: "var(--text-secondary)" }}
        >
          Previous
        </button>
        <span className="px-3 py-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
          Page {page}
        </span>
        <button
          disabled={logs.length < 50}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1.5 rounded-lg text-[11px] font-medium border border-glass-border disabled:opacity-30 cursor-pointer"
          style={{ color: "var(--text-secondary)" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
