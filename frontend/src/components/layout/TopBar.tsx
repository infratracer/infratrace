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
      backdropFilter: "blur(32px) saturate(180%)",
      WebkitBackdropFilter: "blur(32px) saturate(180%)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {showMenu && (
          <button onClick={onMenuClick} aria-label="Open menu" style={{
            background: "none", border: "none",
            color: t.textSecondary, fontSize: 18, cursor: "pointer",
            padding: "4px 8px", borderRadius: 8,
            transition: "color 0.25s",
          }}>{"\u2630"}</button>
        )}
        <h2 style={{
          margin: 0, fontSize: 18, fontWeight: 600,
          color: t.textPrimary, letterSpacing: "-0.3px",
        }}>{title}</h2>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Theme toggle */}
        <button onClick={toggle} aria-label="Toggle theme" style={{
          width: 46, height: 26, borderRadius: 13,
          border: `1px solid ${t.glassBorder}`,
          background: t.bgCard,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          cursor: "pointer",
          position: "relative",
          display: "flex", alignItems: "center", padding: "0 3px",
          transition: "all 0.35s",
          boxShadow: t.glassInnerGlow,
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            background: t.mode === "dark"
              ? `linear-gradient(135deg, ${t.accent}, ${t.teal})`
              : `linear-gradient(135deg, ${t.neonAmber}, #FF8800)`,
            transform: t.mode === "dark" ? "translateX(0)" : "translateX(18px)",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: `0 0 14px ${t.mode === "dark" ? t.accent + "40" : t.neonAmber + "40"}`,
          }} />
        </button>
        {/* Logout */}
        <button onClick={handleLogout} aria-label="Logout" style={{
          background: t.bgCard,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${t.glassBorder}`,
          color: t.textSecondary, fontSize: 10, cursor: "pointer",
          padding: "6px 14px", borderRadius: 10,
          fontWeight: 600, letterSpacing: "0.04em",
          transition: "all 0.25s",
          fontFamily: "inherit",
        }}>
          Logout
        </button>
      </div>
    </div>
  );
}
