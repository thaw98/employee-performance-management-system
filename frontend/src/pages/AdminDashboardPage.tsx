import { useAppSelector } from '../app/hooks'

export function AdminDashboardPage() {
  const user = useAppSelector((s) => s.auth.user)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
      <p className="mt-2 text-slate-600">
        Welcome
        {user?.email ? `, ${user.email}` : ''}. You are signed in as{' '}
        <span className="font-medium text-slate-800">{user?.role ?? '—'}</span>.
      </p>
    </div>
  )
}
