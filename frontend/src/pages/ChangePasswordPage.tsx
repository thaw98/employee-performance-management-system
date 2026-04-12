import { SetNewPasswordForm } from '../components/auth/SetNewPasswordForm'

export function ChangePasswordPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your current password, then choose and confirm a new one.
        </p>
      </div>
      <SetNewPasswordForm variant="settingsPage" />
    </div>
  )
}
