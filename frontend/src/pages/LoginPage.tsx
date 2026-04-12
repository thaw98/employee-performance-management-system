import { Navigate } from 'react-router-dom'

import { LoginForm } from '../components/auth/LoginForm'
import { useAppSelector } from '../app/hooks'
import { FIRST_LOGIN_SET_PASSWORD_PATH } from '../routes/paths'

export function LoginPage() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const mustChangePassword = useAppSelector((s) => s.auth.user?.mustChangePassword === true)

  if (isAuthenticated) {
    return (
      <Navigate to={mustChangePassword ? FIRST_LOGIN_SET_PASSWORD_PATH : '/hr/dashboard'} replace />
    )
  }

  return (
    <div className="epms-login-page">
      <div className="epms-login-bg" aria-hidden>
        <div className="epms-login-bg-circle epms-login-bg-circle-1" />
        <div className="epms-login-bg-circle epms-login-bg-circle-2" />
        <div className="epms-login-bg-circle epms-login-bg-circle-3" />
      </div>

      <div className="epms-login-container">
        <div className="epms-login-brand">
          <div className="epms-login-brand-content">
            <div className="epms-login-brand-icon">
              <i className="bi bi-bar-chart-line-fill" aria-hidden />
            </div>
            <h1 className="epms-login-brand-title">EPMS</h1>
            <p className="epms-login-brand-subtitle">
              Employee Performance Management System
            </p>
            <div className="epms-login-brand-divider" />
            <p className="epms-login-brand-desc">ACE Data Systems Co., Ltd.</p>
            <div className="epms-login-brand-features">
              <div className="epms-login-brand-feature">
                <div className="epms-login-feature-dot" />
                <span>Performance Appraisals</span>
              </div>
              <div className="epms-login-brand-feature">
                <div className="epms-login-feature-dot" />
                <span>360° Feedback</span>
              </div>
              <div className="epms-login-brand-feature">
                <div className="epms-login-feature-dot" />
                <span>Goals & KPI Tracking</span>
              </div>
              <div className="epms-login-brand-feature">
                <div className="epms-login-feature-dot" />
                <span>PIP Monitoring</span>
              </div>
              <div className="epms-login-brand-feature">
                <div className="epms-login-feature-dot" />
                <span>Reports & Analytics</span>
              </div>
            </div>
          </div>
          <div className="epms-login-brand-footer">
            © {new Date().getFullYear()} ACE Data Systems Co., Ltd. All rights reserved.
          </div>
        </div>

        <div className="epms-login-form-panel">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
