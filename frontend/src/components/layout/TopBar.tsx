import { useTheme } from "../../hooks/useTheme";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
  showMenu: boolean;
}

export default function TopBar({ title, onMenuClick, showMenu }: TopBarProps) {
  const t = useTheme();
  const toggle = useThemeStore((s) => s.toggle);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{
      padding: "14px 28px",
      borderBottom: `1px solid ${t.divider}`,
      background: t.topBarBg,
      backdropFilter: "blur(24px) saturate(180%)",
      WebkitBackdropFilter: "blur(24px) saturate(180%)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {showMenu && (
          <button onClick={onMenuClick} style={{
            background: "none", border: "none",
            color: t.textSecondary, fontSize: 18, cursor: "pointer",
            padding: "4px 8px", borderRadius: 6,
            transition: "color 0.2s",
          }}>{"\u2630"}</button>
        )}
        <h2 style={{
          margin: 0, fontSize: 18, fontWeight: 600,
          color: t.textPrimary, letterSpacing: "-0.2px",
        }}>{title}</h2>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Theme toggle */}
        <button onClick={toggle} style={{
          width: 44, height: 24, borderRadius: 12,
          border: `1px solid ${t.glassBorder}`,
          background: t.bgCard, cursor: "pointer",
          position: "relative",
          display: "flex", alignItems: "center", padding: "0 3px",
          transition: "all 0.3s",
          boxShadow: t.glassInnerGlow,
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: "50%",
            background: t.mode === "dark" ? t.accent : t.neonAmber,
            transform: t.mode === "dark" ? "translateX(0)" : "translateX(18px)",
            transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: `0 0 12px ${t.mode === "dark" ? t.accent + "50" : t.neonAmber + "50"}`,
          }} />
        </button>
        {/* Notifications */}
        <div style={{ position: "relative", cursor: "pointer", padding: 4 }} aria-label="Notifications">
          <span style={{ fontSize: 17, color: t.textSecondary }}>{"\u{1F514}"}</span>
        </div>
        {/* Logout */}
        <button onClick={handleLogout} style={{
          background: "none", border: `1px solid ${t.glassBorder}`,
          color: t.textMuted, fontSize: 10, cursor: "pointer",
          padding: "5px 12px", borderRadius: 8,
          fontWeight: 600, letterSpacing: "0.04em",
          transition: "all 0.2s",
          fontFamily: "inherit",
        }}>
          Logout
        </button>
      </div>
    </div>
  );
}
