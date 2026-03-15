import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useProjectStore } from "../../store/projectStore";
import { useTheme } from "../../hooks/useTheme";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function Sidebar({ open, onClose, isMobile }: SidebarProps) {
  const t = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paramId } = useParams();
  const user = useAuthStore((s) => s.user);
  const activeProject = useProjectStore((s) => s.activeProject());
  const projectId = paramId || useProjectStore((s) => s.activeProjectId);

  const getPage = () => {
    const p = location.pathname;
    if (p === "/") return "dashboard";
    if (p.includes("/timeline")) return "timeline";
    if (p.includes("/sensors")) return "sensors";
    if (p.includes("/analysis")) return "analysis";
    if (p.includes("/verify")) return "verify";
    if (p.includes("/log")) return "log";
    if (p.includes("/assumptions")) return "assumptions";
    if (p.includes("/reports")) return "reports";
    if (p.includes("/admin/users")) return "users";
    if (p.includes("/admin/audit")) return "audit";
    return "dashboard";
  };

  const page = getPage();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "\u25A6", path: "/" },
    { id: "timeline", label: "Timeline", icon: "\u2502", path: `/project/${projectId}/timeline` },
    { id: "sensors", label: "Sensors", icon: "\u25C9", path: `/project/${projectId}/sensors` },
    { id: "analysis", label: "AI Analysis", icon: "\u25C7", path: `/project/${projectId}/analysis` },
    { id: "verify", label: "Verify Chain", icon: "\u26D3", path: `/project/${projectId}/verify` },
    { id: "log", label: "Log Decision", icon: "+", path: `/project/${projectId}/log` },
    { id: "assumptions", label: "Assumptions", icon: "\u2261", path: `/project/${projectId}/assumptions` },
    { id: "reports", label: "Reports", icon: "\u25A2", path: `/project/${projectId}/reports` },
  ];

  const adminItems = [
    { id: "users", label: "Users", icon: "\u2630", path: "/admin/users" },
    { id: "audit", label: "Audit Log", icon: "\u2263", path: "/admin/audit-log" },
  ];

  const isAdmin = user?.role === "admin";
  const isAuditor = user?.role === "auditor";

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) onClose();
  };

  return (
    <>
      {isMobile && open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 40,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        />
      )}

      <div style={{
        width: open ? 220 : 0,
        minWidth: open ? 220 : 0,
        background: t.bgSidebar,
        backgroundImage: t.mode === "dark" ? "linear-gradient(180deg, rgba(15, 25, 55, 0.3) 0%, transparent 100%)" : "none",
        borderRight: `1px solid ${t.divider}`,
        display: "flex",
        flexDirection: "column",
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        position: isMobile ? "fixed" : "relative",
        left: 0, top: 0, bottom: 0,
        zIndex: 50,
        boxShadow: isMobile && open ? `8px 0 32px rgba(0,0,0,0.4)` : "none",
      }}>
        {/* Logo */}
        <div style={{
          padding: "20px 16px 16px",
          borderBottom: `1px solid ${t.divider}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `linear-gradient(135deg, ${t.accent}, ${t.teal})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#FFF",
              boxShadow: `0 4px 12px ${t.accent}25`,
            }}>IT</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.textPrimary, whiteSpace: "nowrap", letterSpacing: "-0.2px" }}>InfraTrace</div>
              <div style={{ fontSize: 8, color: t.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap", fontWeight: 600 }}>Audit Platform</div>
            </div>
          </div>
          {isMobile && (
            <button onClick={onClose} style={{ background: "none", border: "none", color: t.textMuted, fontSize: 18, cursor: "pointer", padding: 4 }}>{"\u2715"}</button>
          )}
        </div>

        {/* Project selector */}
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.divider}` }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: t.textMuted, marginBottom: 8, fontWeight: 600 }}>Active Project</div>
          <div style={{
            padding: "10px 12px",
            background: t.bgCard,
            backdropFilter: "blur(20px)",
            borderRadius: 10,
            border: `1px solid ${t.glassBorder}`,
            fontSize: 12, color: t.textPrimary, fontWeight: 500, whiteSpace: "nowrap",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer",
            transition: "border-color 0.2s",
          }}>
            <span>{activeProject?.name || "Select project"}</span>
            {activeProject && <span style={{ fontSize: 8, color: t.neonGreen, textShadow: `0 0 6px ${t.neonGreen}60` }}>{"\u25CF"}</span>}
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: "8px 10px", flex: 1, overflowY: "auto" }}>
          {navItems.map(n => {
            const isActive = page === n.id;
            return (
              <button key={n.id} onClick={() => handleNav(n.path)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "9px 12px", marginBottom: 2, border: "none", borderRadius: 10,
                  cursor: "pointer", fontSize: 12, fontWeight: isActive ? 600 : 500, textAlign: "left",
                  whiteSpace: "nowrap",
                  background: isActive ? t.sidebarActive : "transparent",
                  color: isActive ? t.textPrimary : t.textSecondary,
                  transition: "all 0.2s ease",
                  position: "relative",
                  fontFamily: "inherit",
                }}>
                {isActive && (
                  <div style={{
                    position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                    width: 3, height: 16, borderRadius: 2,
                    background: t.accent,
                    boxShadow: `0 0 8px ${t.accent}60`,
                  }} />
                )}
                <span style={{ fontSize: 14, width: 20, textAlign: "center", color: isActive ? t.accent : t.textMuted }}>{n.icon}</span>
                {n.label}
              </button>
            );
          })}

          {(isAdmin || isAuditor) && (
            <>
              <div style={{
                fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em",
                color: t.textMuted, margin: "20px 12px 8px", fontWeight: 600,
              }}>Admin</div>
              {adminItems.map(n => {
                const isActive = page === n.id;
                return (
                  <button key={n.id} onClick={() => handleNav(n.path)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%",
                      padding: "9px 12px", marginBottom: 2, border: "none", borderRadius: 10,
                      cursor: "pointer", fontSize: 12, fontWeight: isActive ? 600 : 500, textAlign: "left",
                      whiteSpace: "nowrap",
                      background: isActive ? t.sidebarActive : "transparent",
                      color: isActive ? t.textPrimary : t.textSecondary,
                      transition: "all 0.2s ease",
                      fontFamily: "inherit",
                    }}>
                    <span style={{ fontSize: 14, width: 20, textAlign: "center", color: isActive ? t.accent : t.textMuted }}>{n.icon}</span>
                    {n.label}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* User */}
        {user && (
          <div style={{
            padding: "14px 14px",
            borderTop: `1px solid ${t.divider}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: `linear-gradient(135deg, ${t.accentDim}, ${t.tealDim})`,
              border: `1px solid ${t.glassBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600, color: t.accent,
            }}>
              {user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: t.textPrimary }}>{user.full_name}</div>
              <div style={{ fontSize: 9, color: t.textMuted, fontWeight: 500 }}>{user.role.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
