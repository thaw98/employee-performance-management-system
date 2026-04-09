import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ProfileSettingsPage } from './pages/ProfileSettingsPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import PipMonitoringPage from './pages/PipMonitoringPage'
import PipCreatePage from './pages/PipCreatePage'
import PipDetailPage from './pages/PipDetailPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { CreateEmployeeAccountPage } from './features/employeeOnboarding/pages/CreateEmployeeAccountPage'

import { KpiPeriodConfigPage } from './pages/KpiPeriodConfigPage'
import { KpiEvaluationPage } from './pages/KpiEvaluationPage'
import { KpiDashboardPage } from './pages/KpiDashboardPage'
import { KpiAuditLogsPage } from './pages/KpiAuditLogsPage'
import { KpiAssignmentMatrixPage } from './pages/KpiAssignmentMatrixPage'
import { EmployeeKpiViewPage } from './pages/EmployeeKpiViewPage'

function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

function HrProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoleIds={[1]}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/hr/dashboard"
          element={
            <ProtectedLayout>
              <AdminDashboardPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/manager-dashboard"
          element={
            <ProtectedLayout>
              <PlaceholderPage title="Manager Dashboard" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/my-performance"
          element={
            <ProtectedLayout>
              <EmployeeKpiViewPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/appraisals"
          element={
            <ProtectedLayout>
              <KpiEvaluationPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/hr/360-feedback/criteria"
          element={
            <ProtectedLayout>
              <PlaceholderPage title="360 Feedback Criteria" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/360-feedback/give"
          element={
            <ProtectedLayout>
              <PlaceholderPage title="Give 360 Feedback" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/360-feedback/history"
          element={
            <ProtectedLayout>
              <PlaceholderPage title="360 Feedback History" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/pip-monitoring"
          element={
            <ProtectedLayout>
              <PipMonitoringPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/pip-monitoring/create"
          element={
            <ProtectedLayout>
              <PipCreatePage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/pip-monitoring/:id"
          element={
            <ProtectedLayout>
              <PipDetailPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/kpi-assign"
          element={
            <ProtectedLayout>
              <KpiAssignmentMatrixPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/goals"
          element={
            <ProtectedLayout>
              <KpiDashboardPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/kpi-periods"
          element={
            <ProtectedLayout>
              <KpiPeriodConfigPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/reports"
          element={
            <ProtectedLayout>
              <PlaceholderPage title="Reports Center" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/employee-account/create"
          element={
            <HrProtectedLayout>
              <CreateEmployeeAccountPage />
            </HrProtectedLayout>
          }
        />
        <Route
          path="/hr/kpi-audit-logs"
          element={
            <HrProtectedLayout>
              <KpiAuditLogsPage />
            </HrProtectedLayout>
          }
        />
        <Route
          path="/hr/settings/profile"
          element={
            <ProtectedLayout>
              <ProfileSettingsPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/settings/password"
          element={
            <ProtectedLayout>
              <ChangePasswordPage />
            </ProtectedLayout>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
