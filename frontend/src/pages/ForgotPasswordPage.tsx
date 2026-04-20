import { Link } from 'react-router-dom'

const PRIMARY = '#0855BF'

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Forgot Password</h1>
          <p className="mt-2 text-sm text-slate-600">
            Password reset is not available yet. Please contact your administrator.
          </p>
        </div>
        <Link
          to="/login"
          className="block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          style={{ backgroundColor: PRIMARY }}
        >
          Back to Sign in
        </Link>
      </div>
    </div>
  )
}
