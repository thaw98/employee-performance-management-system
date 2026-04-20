import { BarChart3, ShieldCheck } from 'lucide-react'
import { SetNewPasswordForm } from '../../components/auth/SetNewPasswordForm'

/** First-login password change (temporary password → new password). */
export function FirstLoginPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-[440px] rounded-3xl bg-white p-8 shadow-xl">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">EPMS</h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            Employee Performance Management System
          </p>
        </div>

        {/* Security notice badge */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Security Required</p>
            <p className="text-xs text-amber-600">
              Please set a new password to secure your account.
            </p>
          </div>
        </div>

        {/* Password Form */}
        <SetNewPasswordForm variant="loginPanel" />

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} ACE Data Systems. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
