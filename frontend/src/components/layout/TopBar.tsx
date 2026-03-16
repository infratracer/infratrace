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
      padding: "12px 24px",
      borderBottom: `0.5px solid ${t.divider}`,
      background: t.topBarBg,
      backdropFilter: "blur(80px) saturate(180%)",
      WebkitBackdropFilter: "blur(80px) saturate(180%)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {showMenu && (
          <button onClick={onMenuClick} aria-label="Open menu" style={{
            background: "none", border: "none",
            color: t.textSecondary, fontSize: 18, cursor: "pointer",
            padding: "4px 8px", borderRadius: 8,
            transition: "color 0.2s",
          }}>{"\u2630"}</button>
        )}
        <h2 style={{
          margin: 0, fontSize: 17, fontWeight: 600,
          color: t.textPrimary, letterSpacing: "-0.3px",
        }}>{title}</h2>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Theme toggle — iOS style pill */}
        <button onClick={toggle} aria-label="Toggle theme" style={{
          width: 44, height: 24, borderRadius: 12,
          border: `0.5px solid ${t.glassBorder}`,
          background: t.bgCard,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          cursor: "pointer",
          position: "relative",
          display: "flex", alignItems: "center", padding: "0 2px",
          transition: "all 0.3s",
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            background: t.mode === "dark" ? t.accent : "#FF9500",
            transform: t.mode === "dark" ? "translateX(0)" : "translateX(20px)",
            transition: "all 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)",
            boxShadow: `0 1px 4px rgba(0,0,0,0.2)`,
          }} />
        </button>
        {/* Logout */}
        <button onClick={handleLogout} aria-label="Logout" style={{
          background: t.bgCard,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `0.5px solid ${t.glassBorder}`,
          color: t.textSecondary, fontSize: 11, cursor: "pointer",
          padding: "6px 14px", borderRadius: 8,
          fontWeight: 500,
          transition: "all 0.2s",
          fontFamily: "inherit",
        }}>
          Logout
        </button>
      </div>
    </div>
  );
}
