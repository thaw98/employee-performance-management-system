import { SetNewPasswordForm } from '../components/auth/SetNewPasswordForm'

export function FirstLoginPasswordPage() {
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
            <p className="epms-login-brand-subtitle">Employee Performance Management System</p>
            <div className="epms-login-brand-divider" />
            <p className="epms-login-brand-desc">ACE Data Systems Co., Ltd.</p>
          </div>
          <div className="epms-login-brand-footer">
            © {new Date().getFullYear()} ACE Data Systems Co., Ltd. All rights reserved.
          </div>
        </div>

        <div className="epms-login-form-panel">
          <SetNewPasswordForm variant="loginPanel" />
        </div>
      </div>
    </div>
  )
}
