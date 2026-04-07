import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { logout } from '../../features/auth/authSlice'

const PRIMARY = '#0855BF'

export function AppNavbar() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  return (
    <header
      className="border-b border-slate-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] z-10 relative"
      style={{ borderBottomColor: `${PRIMARY}15` }}
    >
      <div className="flex h-16 w-full items-center justify-between px-4 md:justify-end">
        {/* Mobile branding */}
        <div className="flex items-center md:hidden gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <i className="bi bi-hexagon-fill text-xl leading-none"></i>
          </div>
          <span className="text-lg font-bold" style={{ color: PRIMARY }}>
            ACE Data Systems
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-700">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="font-medium text-slate-900 leading-tight">{user?.email || 'User'}</span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{user?.role || 'Admin'}</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200 shadow-sm">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <button
            type="button"
            className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => dispatch(logout())}
            title="Log out"
          >
            <i className="bi bi-box-arrow-right text-lg"></i>
          </button>
        </div>
      </div>
    </header>
  )
}
