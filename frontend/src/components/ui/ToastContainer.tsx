import { useToastStore } from "../../store/toastStore";
import { useTheme } from "../../hooks/useTheme";

export default function ToastContainer() {
  const t = useTheme();
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  const colorMap = {
    success: { bg: t.neonGreenDim, border: t.neonGreen, icon: "\u2713" },
    error: { bg: t.neonRedDim, border: t.neonRed, icon: "\u2715" },
    info: { bg: t.accentDim, border: t.accent, icon: "\u2139" },
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      maxWidth: 360,
    }}>
      {toasts.map((toast) => {
        const c = colorMap[toast.type];
        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              padding: "12px 16px",
              background: t.bgElevated,
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
              border: `1px solid ${c.border}30`,
              borderLeft: `3px solid ${c.border}`,
              borderRadius: 12,
              boxShadow: `0 8px 32px rgba(0,0,0,0.3)`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              animation: "slideIn 0.25s ease-out",
            }}
          >
            <span style={{ color: c.border, fontSize: 14, flexShrink: 0 }}>{c.icon}</span>
            <span style={{ fontSize: 12, color: t.textPrimary, lineHeight: 1.4 }}>{toast.message}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
