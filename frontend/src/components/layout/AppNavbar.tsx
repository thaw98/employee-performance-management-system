import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { logout } from '../../features/auth/authSlice'
import { useGetProfileQuery } from '../../features/user/userApi'
import { resolveProfilePictureSrc } from '../../utils/mediaUrl'
import { Clock, Calendar } from 'lucide-react'

const PRIMARY = '#0855BF'

export function AppNavbar() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const tokenUser = useAppSelector((s) => s.auth.user)
  const { data: profileResponse } = useGetProfileQuery()
  const [time, setTime] = useState(new Date())
  
  const user = profileResponse?.data || tokenUser
  const navAvatarSrc = resolveProfilePictureSrc(user?.profilePictureUrl)

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('profile')) return 'User Profile'
    if (path.includes('settings')) return 'System Settings'
    if (path.includes('feedback')) return '360° Feedback'
    if (path.includes('performance')) return 'Performance'
    if (path.includes('training')) return 'Training'
    if (path.includes('leave')) return 'Leave & Attendance'
    return 'Dashboard'
  }

  const getRolePrefix = () => {
    const userRoleStr = (user?.role || '').toUpperCase()
    const userRoleId = user?.roleId
    if (userRoleStr === 'HR' || userRoleId === 1) return '/hr'
    if (userRoleId === 2 || userRoleId === 3 || userRoleStr.includes('HEAD') || userRoleStr.includes('MANAGER') || userRoleStr.includes('LEAD')) return '/manager'
    return '/employee'
  }

  const rolePrefix = getRolePrefix()

  const formattedDay = time.toLocaleDateString('en-US', { weekday: 'long' })
  const formattedDate = time.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const formattedTime = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  return (
    <header
      className="border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.02)] z-10 relative sticky top-0"
      style={{ borderBottomColor: `${PRIMARY}15` }}
    >
      <div className="flex min-h-[64px] md:h-20 w-full items-center justify-between px-6 gap-4">
        {/* Left Side: Dynamic Page Title + High-Visibility Clock */}
        <div className="flex flex-col justify-center min-w-0 py-2">
           <h1 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase flex items-center gap-2 leading-none mb-1.5">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              <span className="truncate">{getPageTitle()}</span>
           </h1>
           
           <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <div className="flex items-center gap-1.5 text-[10px] md:text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                 <Calendar size={12} className="text-slate-300 dark:text-slate-600" />
                 <span>{formattedDay}, {formattedDate}</span>
              </div>
              <div className="hidden sm:block h-3 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-100 dark:shadow-none animate-in slide-in-from-left-4 duration-500">
                 <Clock size={12} className="text-blue-100" />
                 <span className="text-[10px] md:text-[11px] font-black tracking-widest uppercase">
                    CURRENT TIME: {formattedTime}
                 </span>
              </div>
           </div>
        </div>

        {/* Right Side: Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="flex items-center gap-3 text-sm text-slate-700 hover:bg-slate-50 p-1.5 pr-3 rounded-xl transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer border border-slate-100 hover:border-blue-200 bg-white/50 shadow-sm"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-bold text-slate-800 leading-tight">{user?.name || 'User'}</span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{user?.role || 'Admin'}</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border-2 border-white shadow-md overflow-hidden ring-1 ring-slate-100">
               {navAvatarSrc ? (
                 <img src={navAvatarSrc} alt="Profile" className="h-full w-full object-cover pointer-events-none" />
               ) : (
                 user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'
               )}
            </div>
            <i className={`bi bi-chevron-down text-slate-400 text-[10px] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="px-4 py-3 border-b border-slate-50 sm:hidden">
                <p className="text-sm font-black text-slate-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">{user?.role || 'Admin'}</p>
              </div>

              <div className="p-1.5 space-y-1">
                <Link
                  to={`${rolePrefix}/profile`}
                  className="flex items-center gap-3 px-3 py-2.5 text-xs font-black text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-all group"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <i className="bi bi-person h-8 w-8 flex items-center justify-center bg-slate-50 rounded-lg group-hover:bg-white border border-transparent group-hover:border-blue-100"></i>
                  USER PROFILE
                </Link>
                <Link
                  to={`${rolePrefix}/settings/system`}
                  className="flex items-center gap-3 px-3 py-2.5 text-xs font-black text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-all group"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <i className="bi bi-gear h-8 w-8 flex items-center justify-center bg-slate-50 rounded-lg group-hover:bg-white border border-transparent group-hover:border-blue-100"></i>
                  SYSTEM SETTINGS
                </Link>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-xs font-black text-red-500 rounded-xl hover:bg-red-50 transition-all text-left group"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    dispatch(logout());
                  }}
                >
                  <i className="bi bi-box-arrow-right h-8 w-8 flex items-center justify-center bg-red-50 rounded-lg group-hover:bg-white border border-transparent group-hover:border-red-100"></i>
                  LOG OUT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
