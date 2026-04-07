import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { logout } from '../../features/auth/authSlice'
import { useGetProfileQuery } from '../../features/user/userApi'

const PRIMARY = '#0855BF'

export function AppNavbar() {
  const dispatch = useAppDispatch()
  const tokenUser = useAppSelector((s) => s.auth.user)
  const { data: profileResponse } = useGetProfileQuery()
  
  const user = profileResponse?.data || tokenUser

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="flex items-center gap-3 text-sm text-slate-700 hover:bg-slate-50 p-1.5 pr-3 rounded-xl transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer border border-transparent hover:border-slate-200"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-medium text-slate-900 leading-tight">{user?.email || 'User'}</span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{user?.role || 'Admin'}</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200 shadow-sm overflow-hidden">
               {profileResponse?.data?.profilePictureBase64 ? (
                 <img src={profileResponse.data.profilePictureBase64} alt="Profile" className="h-full w-full object-cover pointer-events-none" />
               ) : (
                 user?.email?.charAt(0).toUpperCase() || 'U'
               )}
            </div>
            <i className={`bi bi-chevron-down text-slate-400 text-[10px] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-100 sm:hidden">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.email || 'User'}</p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">{user?.role || 'Admin'}</p>
              </div>

              <div className="p-1">
                <Link
                  to="/admin/settings/profile"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-blue-700 transition-colors group"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <i className="bi bi-person text-lg text-slate-400 group-hover:text-blue-600 transition-colors"></i>
                  Profile Settings
                </Link>

                <Link
                  to="/admin/settings/password"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-blue-700 transition-colors group"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <i className="bi bi-shield-lock text-lg text-slate-400 group-hover:text-blue-600 transition-colors"></i>
                  Change Password
                </Link>
              </div>

              <div className="h-px bg-slate-100 my-1"></div>

              <div className="p-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors text-left group"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    dispatch(logout());
                  }}
                >
                  <i className="bi bi-box-arrow-right text-lg text-red-400 group-hover:text-red-500 transition-colors"></i>
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
