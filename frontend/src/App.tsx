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

function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
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
          path="/admin/dashboard"
          element={
            <ProtectedLayout>
              <AdminDashboardPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/admin/manager-dashboard"
          element={
            <ProtectedLayout>
              <PlaceholderPage title="Manager Dashboard" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/admin/my-performance"
          element={
            <ProtectedLayout>
              <PlaceholderPage title="My Performance" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/admin/appraisals"
          element={
            <ProtectedLayout>
              <PlaceholderPage title="Performance Appraisals" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/admin/360-feedback"
          element={
            <ProtectedLayout>
              <PlaceholderPage title="360° Feedback" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/admin/pip-monitoring"
          element={
            <ProtectedLayout>
              <PipMonitoringPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/admin/pip-monitoring/create"
          element={
            <ProtectedLayout>
              <PipCreatePage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/admin/pip-monitoring/:id"
          element={
            <ProtectedLayout>
              <PipDetailPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/admin/goals"
          element={
            <ProtectedLayout>
              <PlaceholderPage title="Goals & KPIs" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedLayout>
              <PlaceholderPage title="Reports Center" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/admin/settings/profile"
          element={
            <ProtectedLayout>
              <ProfileSettingsPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/admin/settings/password"
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
