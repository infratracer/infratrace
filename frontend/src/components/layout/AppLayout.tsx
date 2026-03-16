import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import ErrorBoundary from "./ErrorBoundary";
import ToastContainer from "../ui/ToastContainer";
import { useTheme } from "../../hooks/useTheme";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/admin/users": "User Management",
  "/admin/audit-log": "Audit Log",
};

function getTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.includes("/timeline")) return "Decision Timeline";
  if (pathname.includes("/decision/")) return "Decision Detail";
  if (pathname.includes("/log")) return "Log Decision";
  if (pathname.includes("/sensors")) return "Sensor Dashboard";
  if (pathname.includes("/analysis")) return "AI Analysis";
  if (pathname.includes("/verify")) return "Chain Verification";
  if (pathname.includes("/assumptions")) return "Assumptions";
  if (pathname.includes("/reports")) return "Reports";
  return "InfraTrace";
}

export default function AppLayout() {
  const t = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const title = getTitle(location.pathname);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif",
      background: t.bg,
      backgroundImage: t.bgGradientMesh,
      color: t.textPrimary,
      minHeight: "100vh",
      display: "flex",
      position: "relative",
      transition: "background 0.5s ease",
    }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
          showMenu={!sidebarOpen || isMobile}
        />
        <div style={{
          flex: 1, overflow: "auto",
          padding: isMobile ? "16px" : "24px 28px",
        }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>

      <ToastContainer />

      <style>{`
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(${t.mode === "dark" ? "255,255,255" : "0,0,0"}, 0.12); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(${t.mode === "dark" ? "255,255,255" : "0,0,0"}, 0.20); }

        input::placeholder, textarea::placeholder { color: ${t.textMuted}; }
        select option { background: ${t.mode === "dark" ? "#1c1c1e" : "#fff"}; color: ${t.textPrimary}; }
      `}</style>
    </div>
  );
}
