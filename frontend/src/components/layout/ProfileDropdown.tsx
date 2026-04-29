import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { logout } from '../../features/auth/authSlice'
import { useGetProfileQuery } from '../../features/user/userApi'
import { resolveProfilePictureSrc } from '../../utils/mediaUrl'
import { ChevronDown, User, Settings, LogOut, Shield, PenLine } from 'lucide-react'

export function ProfileDropdown() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const tokenUser = useAppSelector((s) => s.auth.user)
  const { data: profileResponse } = useGetProfileQuery()
  
  const user = profileResponse?.data || tokenUser
  const avatarSrc = resolveProfilePictureSrc(user?.profilePictureUrl)

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  // Determine settings path based on role
  const rolePrefix = user?.role?.toLowerCase() === 'hr' ? '/hr' : (user?.role?.toLowerCase() === 'manager' ? '/manager' : '/employee')
  const profileSettingsPath = `${rolePrefix}/settings/profile`
  const signatureSettingsPath = `${rolePrefix}/settings/signature`
  const systemSettingsPath = `${rolePrefix}/settings/system`

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-800 group outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate uppercase mt-1 group-hover:text-blue-600 transition-colors">
            {user?.name || 'User'}
          </p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {user?.role || 'Role'}
          </p>
        </div>
        
        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold overflow-hidden border-2 border-transparent group-hover:border-blue-100 dark:group-hover:border-blue-900/50 transition-all shadow-sm">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            user?.name?.charAt(0).toUpperCase() || 'U'
          )}
        </div>
        
        <ChevronDown 
          size={16} 
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 mb-2">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate">{user?.name}</p>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{user?.email}</p>
          </div>

          <div className="px-2 space-y-1">
            <Link
              to={profileSettingsPath}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <User size={18} />
              </div>
              User Settings
            </Link>

            <Link
              to={signatureSettingsPath}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <PenLine size={18} />
              </div>
              Siganture Settings
            </Link>

            <Link
              to={systemSettingsPath}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Settings size={18} />
              </div>
              System Settings
            </Link>
            

          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 px-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                <LogOut size={18} />
              </div>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
