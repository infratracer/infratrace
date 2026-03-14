import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useThemeStore } from "./store/themeStore";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TimelinePage from "./pages/TimelinePage";
import DecisionDetailPage from "./pages/DecisionDetailPage";
import LogDecisionPage from "./pages/LogDecisionPage";
import SensorDashboardPage from "./pages/SensorDashboardPage";
import AIAnalysisPage from "./pages/AIAnalysisPage";
import VerifyChainPage from "./pages/VerifyChainPage";
import AssumptionsPage from "./pages/AssumptionsPage";
import ReportsPage from "./pages/ReportsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AuditLogPage from "./pages/AuditLogPage";

export default function App() {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    document.documentElement.className = mode;
  }, [mode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/project/:id/timeline" element={<TimelinePage />} />
          <Route path="/project/:id/decision/:did" element={<DecisionDetailPage />} />
          <Route path="/project/:id/log" element={<LogDecisionPage />} />
          <Route path="/project/:id/sensors" element={<SensorDashboardPage />} />
          <Route path="/project/:id/analysis" element={<AIAnalysisPage />} />
          <Route path="/project/:id/verify" element={<VerifyChainPage />} />
          <Route path="/project/:id/assumptions" element={<AssumptionsPage />} />
          <Route path="/project/:id/reports" element={<ReportsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/audit-log" element={<AuditLogPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
