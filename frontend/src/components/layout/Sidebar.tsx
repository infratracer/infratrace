import { NavLink, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  GitBranch,
  Radio,
  Brain,
  Link2,
  PlusCircle,
  List,
  FileText,
  Users,
  ScrollText,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useProjectStore } from "../../store/projectStore";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { id: paramId } = useParams();
  const user = useAuthStore((s) => s.user);
  const activeProject = useProjectStore((s) => s.activeProject());
  const projectId = paramId || useProjectStore((s) => s.activeProjectId);

  const projectNav = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: `/project/${projectId}/timeline`, icon: GitBranch, label: "Timeline" },
    { to: `/project/${projectId}/sensors`, icon: Radio, label: "Sensors" },
    { to: `/project/${projectId}/analysis`, icon: Brain, label: "AI Analysis" },
    { to: `/project/${projectId}/verify`, icon: Link2, label: "Verify Chain" },
    { to: `/project/${projectId}/log`, icon: PlusCircle, label: "Log Decision" },
    { to: `/project/${projectId}/assumptions`, icon: List, label: "Assumptions" },
    { to: `/project/${projectId}/reports`, icon: FileText, label: "Reports" },
  ];

  const adminNav = [
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/audit-log", icon: ScrollText, label: "Audit Log" },
  ];

  const isAdmin = user?.role === "admin";
  const isAuditor = user?.role === "auditor";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
      isActive
        ? "text-accent bg-accent-dim"
        : "hover:bg-glass-border"
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          style={{ backdropFilter: "blur(20px)" }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[220px] flex flex-col border-r border-glass-border transition-transform duration-300 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "var(--bg-sidebar)" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-[12px]">
              IT
            </div>
            <div>
              <div className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                InfraTrace
              </div>
              <div className="text-[9px] font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Audit Platform
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Active project indicator */}
        {activeProject && (
          <div className="mx-3 mb-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>
              Active Project
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[12px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {activeProject.name}
              </span>
              <span className="w-2 h-2 rounded-full bg-neon-green neon-glow-green" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {projectNav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={onClose} style={{ color: "var(--text-secondary)" }}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          {(isAdmin || isAuditor) && (
            <>
              <div
                className="mt-4 mb-2 px-3 text-[9px] uppercase tracking-widest font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                Admin
              </div>
              {adminNav.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} className={linkClass} onClick={onClose} style={{ color: "var(--text-secondary)" }}>
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User info */}
        {user && (
          <div className="px-4 py-3 border-t border-glass-border">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold"
                style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}
              >
                {user.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {user.full_name}
                </div>
                <div className="text-[10px] capitalize" style={{ color: "var(--text-muted)" }}>
                  {user.role.replace("_", " ")}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
