import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useThemeStore } from "./store/themeStore";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// Eager load login (first screen) and dashboard (most common)
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

// Lazy load all other pages
const TimelinePage = lazy(() => import("./pages/TimelinePage"));
const DecisionDetailPage = lazy(() => import("./pages/DecisionDetailPage"));
const LogDecisionPage = lazy(() => import("./pages/LogDecisionPage"));
const SensorDashboardPage = lazy(() => import("./pages/SensorDashboardPage"));
const AIAnalysisPage = lazy(() => import("./pages/AIAnalysisPage"));
const VerifyChainPage = lazy(() => import("./pages/VerifyChainPage"));
const AssumptionsPage = lazy(() => import("./pages/AssumptionsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AuditLogPage = lazy(() => import("./pages/AuditLogPage"));

function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
      <div style={{
        width: 28, height: 28,
        border: "2.5px solid rgba(255,255,255,0.08)",
        borderTopColor: "#0A84FF",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );
}

export default function App() {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    document.documentElement.className = mode;
  }, [mode]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </BrowserRouter>
  );
}
