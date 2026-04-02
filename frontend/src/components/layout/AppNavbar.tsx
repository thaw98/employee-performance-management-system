import { Link } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { logout } from '../../features/auth/authSlice'

const PRIMARY = '#0855BF'

export function AppNavbar() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  return (
    <header
      className="border-b border-slate-200 bg-white shadow-sm"
      style={{ borderBottomColor: `${PRIMARY}33` }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          to="/admin/dashboard"
          className="text-lg font-semibold"
          style={{ color: PRIMARY }}
        >
          Ace Data Systems Ltd.
        </Link>
        <div className="flex items-center gap-4 text-sm text-slate-700">
          <span className="hidden sm:inline">{user?.email}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            {user?.role}
          </span>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-800 transition hover:bg-slate-50"
            onClick={() => dispatch(logout())}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
