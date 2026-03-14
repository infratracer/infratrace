import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

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
  if (pathname.includes("/assumptions")) return "Assumptions Register";
  if (pathname.includes("/reports")) return "Reports";
  return "InfraTrace";
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col md:ml-[220px] min-w-0">
        <TopBar title={title} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
