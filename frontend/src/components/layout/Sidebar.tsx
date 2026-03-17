import { useState } from "react";
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
  const projects = useProjectStore((s) => s.projects);
  const activeProject = useProjectStore((s) => s.activeProject());
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const storeProjectId = useProjectStore((s) => s.activeProjectId);
  const projectId = paramId || storeProjectId;
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  const getPage = () => {
    const p = location.pathname;
    if (p === "/" || p === "/dashboard") return "dashboard";
    if (p.includes("/timeline")) return "timeline";
    if (p.includes("/sensors")) return "sensors";
    if (p.includes("/analysis")) return "analysis";
    if (p.includes("/verify")) return "verify";
    if (p.includes("/log")) return "log";
    if (p.includes("/assumptions")) return "assumptions";
    if (p.includes("/reports")) return "reports";
    if (p === "/map") return "map";
    if (p.includes("/admin/users")) return "users";
    if (p.includes("/admin/audit")) return "audit";
    return "dashboard";
  };

  const page = getPage();

  const hasProject = !!projectId;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "\u25A6", path: "/dashboard", disabled: false },
    { id: "map", label: "Map", icon: "\u25C8", path: "/map", disabled: false },
    { id: "timeline", label: "Timeline", icon: "\u2502", path: `/project/${projectId}/timeline`, disabled: !hasProject },
    { id: "sensors", label: "Sensors", icon: "\u25C9", path: `/project/${projectId}/sensors`, disabled: !hasProject },
    { id: "analysis", label: "AI Analysis", icon: "\u25C7", path: `/project/${projectId}/analysis`, disabled: !hasProject },
    { id: "verify", label: "Verify Chain", icon: "\u26D3", path: `/project/${projectId}/verify`, disabled: !hasProject },
    { id: "log", label: "Log Decision", icon: "+", path: `/project/${projectId}/log`, disabled: !hasProject },
    { id: "assumptions", label: "Assumptions", icon: "\u2261", path: `/project/${projectId}/assumptions`, disabled: !hasProject },
    { id: "reports", label: "Reports", icon: "\u25A2", path: `/project/${projectId}/reports`, disabled: !hasProject },
    { id: "sensor-config", label: "Sensor Config", icon: "\u2699", path: `/project/${projectId}/sensors/config`, disabled: !hasProject },
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
            background: "rgba(0,0,0,0.35)",
            zIndex: 40,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        />
      )}

      <div style={{
        width: open ? 228 : 0,
        minWidth: open ? 228 : 0,
        background: t.bgSidebar,
        backdropFilter: "blur(80px) saturate(180%)",
        WebkitBackdropFilter: "blur(80px) saturate(180%)",
        borderRight: `0.5px solid ${t.divider}`,
        display: "flex",
        flexDirection: "column",
        transition: "all 0.38s cubic-bezier(0.25, 0.1, 0.25, 1)",
        overflow: "hidden",
        position: isMobile ? "fixed" : "relative",
        left: 0, top: 0, bottom: 0,
        zIndex: 50,
        boxShadow: isMobile && open ? `0 0 60px rgba(0,0,0,0.25)` : "none",
      }}>
        {/* Logo */}
        <div style={{
          padding: "20px 18px 16px",
          borderBottom: `0.5px solid ${t.divider}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src={t.mode === "dark" ? "/logo-dark.png" : "/logo-light.png"}
              alt="InfraTrace"
              style={{ height: 42, width: "auto", objectFit: "contain" }}
            />
          </div>
          {isMobile && (
            <button onClick={onClose} style={{ background: "none", border: "none", color: t.textSecondary, fontSize: 18, cursor: "pointer", padding: 4 }}>{"\u2715"}</button>
          )}
        </div>

        {/* Project selector */}
        <div style={{ padding: "12px 14px", borderBottom: `0.5px solid ${t.divider}`, position: "relative" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.01em", color: t.textSecondary, marginBottom: 6, fontWeight: 500 }}>Active Project</div>
          <div
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            style={{
              padding: "8px 12px",
              background: t.bgCard,
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              borderRadius: 10,
              border: `0.5px solid ${showProjectDropdown ? t.accent : t.glassBorder}`,
              fontSize: 13, color: t.textPrimary, fontWeight: 500, whiteSpace: "nowrap",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{activeProject?.name || "Select project"}</span>
            <span style={{ fontSize: 10, color: t.textMuted, transform: showProjectDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>{"\u25BC"}</span>
          </div>
          {showProjectDropdown && projects.length > 0 && (
            <div style={{
              position: "absolute", left: 14, right: 14, top: "100%", zIndex: 60,
              marginTop: 4, borderRadius: 10, overflow: "hidden",
              background: t.bgElevated, border: `0.5px solid ${t.glassBorder}`,
              backdropFilter: "blur(40px)", boxShadow: t.glassShadow,
              maxHeight: 200, overflowY: "auto",
            }}>
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setActiveProject(p.id);
                    setShowProjectDropdown(false);
                    navigate(`/project/${p.id}/timeline`);
                    if (isMobile) onClose();
                  }}
                  style={{
                    padding: "8px 12px", fontSize: 12, cursor: "pointer",
                    color: p.id === projectId ? t.accent : t.textPrimary,
                    background: p.id === projectId ? t.sidebarActive : "transparent",
                    fontWeight: p.id === projectId ? 600 : 400,
                    transition: "background 0.15s",
                    borderBottom: `0.5px solid ${t.divider}`,
                  }}
                  onMouseEnter={(e) => { if (p.id !== projectId) (e.currentTarget as HTMLElement).style.background = t.bgCardHover; }}
                  onMouseLeave={(e) => { if (p.id !== projectId) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {p.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nav */}
        <div style={{ padding: "6px 8px", flex: 1, overflowY: "auto" }}>
          {navItems.map(n => {
            const isActive = page === n.id;
            return (
              <button key={n.id} onClick={() => !n.disabled && handleNav(n.path)} aria-label={`Navigate to ${n.label}`}
                disabled={n.disabled}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "8px 12px", marginBottom: 1, border: "none", borderRadius: 10,
                  cursor: n.disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: isActive ? 600 : 400, textAlign: "left",
                  whiteSpace: "nowrap",
                  background: isActive ? t.sidebarActive : "transparent",
                  color: n.disabled ? t.textMuted : isActive ? t.textPrimary : t.textSecondary,
                  opacity: n.disabled ? 0.5 : 1,
                  transition: "all 0.2s ease",
                  position: "relative",
                  fontFamily: "inherit",
                }}>
                {isActive && (
                  <div style={{
                    position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                    width: 3, height: 16, borderRadius: 1.5,
                    background: t.accent,
                  }} />
                )}
                <span style={{ fontSize: 14, width: 20, textAlign: "center", color: isActive ? t.accent : t.textMuted, transition: "color 0.2s" }}>{n.icon}</span>
                {n.label}
              </button>
            );
          })}

          {(isAdmin || isAuditor) && (
            <>
              <div style={{
                fontSize: 11, letterSpacing: "0.01em",
                color: t.textMuted, margin: "16px 12px 6px", fontWeight: 500,
              }}>Admin</div>
              {adminItems.map(n => {
                const isActive = page === n.id;
                return (
                  <button key={n.id} onClick={() => handleNav(n.path)} aria-label={`Navigate to ${n.label}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%",
                      padding: "8px 12px", marginBottom: 1, border: "none", borderRadius: 10,
                      cursor: "pointer", fontSize: 13, fontWeight: isActive ? 600 : 400, textAlign: "left",
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
            borderTop: `0.5px solid ${t.divider}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: t.bgCard,
              border: `0.5px solid ${t.glassBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600, color: t.accent,
              backdropFilter: "blur(20px)",
            }}>
              {(user.full_name || "?").split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: t.textPrimary }}>{user.full_name}</div>
              <div style={{ fontSize: 11, color: t.textSecondary, fontWeight: 400 }}>{user.role.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
