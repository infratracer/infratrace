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
const PublicTimelinePage = lazy(() => import("./pages/PublicTimelinePage"));
const SensorConfigPage = lazy(() => import("./pages/SensorConfigPage"));
const ProjectSetupPage = lazy(() => import("./pages/ProjectSetupPage"));

// Auth pages (no login required)
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const AcceptInvitePage = lazy(() => import("./pages/AcceptInvitePage"));

function PageLoader() {
  return <div style={{ minHeight: "100vh" }} />;
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
          {/* Public routes — no auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/invite/:token" element={<AcceptInvitePage />} />
          <Route path="/public/:id" element={<PublicTimelinePage />} />

          {/* Protected routes — require auth */}
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
            <Route path="/project/:id/sensors/config" element={<SensorConfigPage />} />
            <Route path="/project/:id/analysis" element={<AIAnalysisPage />} />
            <Route path="/project/:id/verify" element={<VerifyChainPage />} />
            <Route path="/project/:id/assumptions" element={<AssumptionsPage />} />
            <Route path="/project/:id/reports" element={<ReportsPage />} />
            <Route path="/project/:id/setup" element={<ProjectSetupPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/audit-log" element={<AuditLogPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
