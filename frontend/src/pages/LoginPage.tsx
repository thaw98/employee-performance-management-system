import { Navigate } from 'react-router-dom'

import { LoginForm } from '../components/auth/LoginForm'
import { useAppSelector } from '../app/hooks'

const PRIMARY = '#0855BF'

export function LoginPage() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Sign in
          </h1>
          <p className="mt-2 text-sm font-medium" style={{ color: PRIMARY }}>
            Ace Data Systems Ltd.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
