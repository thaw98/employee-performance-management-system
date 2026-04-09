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
import { CriteriaPage } from './pages/CriteriaPage'
import { GiveFeedbackPage } from './pages/GiveFeedbackPage'
import { FeedbackHistoryPage } from './pages/FeedbackHistoryPage'

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
              <PlaceholderPage title="My Performance" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/hr/appraisals"
          element={
            <ProtectedLayout>
              <PlaceholderPage title="Performance Appraisals" />
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
          path="/hr/goals"
          element={
            <ProtectedLayout>
              <PlaceholderPage title="Goals & KPIs" />
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
