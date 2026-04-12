import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { AppLayout } from './components/layout/AppLayout'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ProfileSettingsPage } from './pages/ProfileSettingsPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { FirstLoginPasswordPage } from './pages/FirstLoginPasswordPage'
import PipMonitoringPage from './pages/PipMonitoringPage'
import PipCreatePage from './pages/PipCreatePage'
import PipDetailPage from './pages/PipDetailPage'
import { AuthBootstrap } from './features/auth/AuthBootstrap'
import { FIRST_LOGIN_SET_PASSWORD_PATH } from './routes/paths'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { CreateEmployeeAccountPage } from './features/employeeOnboarding/pages/CreateEmployeeAccountPage'
import { CriteriaPage } from './pages/CriteriaPage'
import { GiveFeedbackPage } from './pages/GiveFeedbackPage'
import { FeedbackHistoryPage } from './pages/FeedbackHistoryPage'
import { EmployeeKpiViewPage } from './pages/EmployeeKpiViewPage'
import { KpiEvaluationPage } from './pages/KpiEvaluationPage'
import { KpiAssignmentMatrixPage } from './pages/KpiAssignmentMatrixPage'
import { KpiDashboardPage } from './pages/KpiDashboardPage'
import { KpiPeriodConfigPage } from './pages/KpiPeriodConfigPage'
import { KpiAuditLogsPage } from './pages/KpiAuditLogsPage'
import { SelfAssessmentPage } from './pages/SelfAssessmentPage'
import { SelfAssessmentReviewListPage } from './pages/SelfAssessmentReviewListPage'
import { SelfAssessmentSubjectPage } from './pages/SelfAssessmentSubjectPage'

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
      <AuthBootstrap />
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path={FIRST_LOGIN_SET_PASSWORD_PATH}
          element={
            <ProtectedRoute>
              <FirstLoginPasswordPage />
            </ProtectedRoute>
          }
        />
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
              <CriteriaPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/360-feedback/give"
          element={
            <ProtectedLayout>
              <GiveFeedbackPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/360-feedback/get"
          element={
            <ProtectedLayout>
              <PlaceholderPage title="Get Feedback" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/360-feedback/history"
          element={
            <ProtectedLayout>
              <FeedbackHistoryPage />
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
          path="/hr/self-assessment"
          element={
            <ProtectedLayout>
              <SelfAssessmentPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/compliance-review"
          element={
            <ProtectedLayout>
              <SelfAssessmentReviewListPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/self-assessment-subjects"
          element={
            <HrProtectedLayout>
              <SelfAssessmentSubjectPage />
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
