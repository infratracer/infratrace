import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
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
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
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
          padding: isMobile ? "18px" : "28px 32px",
        }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
