import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { logout } from '../../features/auth/authSlice'
import { useGetProfileQuery } from '../../features/user/userApi'
import { resolveProfilePictureSrc } from '../../utils/mediaUrl'
import { getRoleGroup } from '../../utils/dashboardRedirect'
import { ChevronDown, User, Settings, LogOut, PenLine, Calendar, HelpCircle } from 'lucide-react'

interface ProfileDropdownProps {
  variant?: 'default' | 'dash'
}

export function ProfileDropdown({ variant = 'default' }: ProfileDropdownProps) {
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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const roleGroup = tokenUser ? getRoleGroup(tokenUser) : null
  const rolePrefix =
    roleGroup === 'HR'
      ? '/hr'
      : roleGroup === 'MANAGER'
      ? '/manager'
      : roleGroup === 'AUDIT'
      ? '/audit'
      : '/employee'
  const profilePath = `${rolePrefix}/profile`
  const signatureSettingsPath = `${rolePrefix}/settings/signature`
  const systemSettingsPath = `${rolePrefix}/settings/system`
  const timeSettingsPath = `${rolePrefix}/settings/system/time`
  const faqPath = `${rolePrefix}/faq`
  const isHR = roleGroup === 'HR' || profileResponse?.data?.role === 'HR'

  const displayName = user?.name || 'User'
  const displayRole = (user?.role || 'Role').toUpperCase()
  const initial = displayName.charAt(0).toUpperCase() || 'U'

  if (variant === 'dash') {
    return (
      <div className={`top-bar-profile-wrap hidden sm:block${isOpen ? ' is-open' : ''}`} ref={dropdownRef}>
        <button
          type="button"
          className="top-bar-profile"
          aria-label="User menu"
          aria-expanded={isOpen}
          aria-haspopup="true"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="top-bar-profile-text">
            <span className="top-bar-profile-name">{displayName}</span>
            <span className="top-bar-profile-role">{displayRole}</span>
          </span>
          <span className="top-bar-avatar">
            {avatarSrc ? <img src={avatarSrc} alt="" /> : initial}
          </span>
          <i className="bi bi-chevron-down top-bar-chevron" />
        </button>

        {!isOpen ? null : (
          <div className="profile-dropdown" role="menu">
            <div className="profile-dropdown-header">
              <div className="profile-dropdown-header-inner">
                <div className="profile-dropdown-avatar">
                  {avatarSrc ? <img src={avatarSrc} alt="" /> : <span>{initial}</span>}
                </div>
                <div className="profile-dropdown-info">
                  <p className="profile-dropdown-name">{displayName}</p>
                  <p className="profile-dropdown-email">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="profile-dropdown-divider" />
            <div className="profile-dropdown-menu">
              <Link to={profilePath} className="profile-dropdown-item" role="menuitem" onClick={() => setIsOpen(false)}>
                <span className="profile-dropdown-icon profile-dropdown-icon--blue">
                  <i className="bi bi-person" />
                </span>
                <div className="profile-dropdown-item-text">
                  <span>User Profile</span>
                </div>
              </Link>
              <Link
                to={signatureSettingsPath}
                className="profile-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <span className="profile-dropdown-icon profile-dropdown-icon--violet">
                  <i className="bi bi-pen" />
                </span>
                <div className="profile-dropdown-item-text">
                  <span>Signature Settings</span>
                </div>
              </Link>
              <Link
                to={systemSettingsPath}
                className="profile-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <span className="profile-dropdown-icon profile-dropdown-icon--gray">
                  <i className="bi bi-gear" />
                </span>
                <div className="profile-dropdown-item-text">
                  <span>System Settings</span>
                </div>
              </Link>
              <Link
                to={faqPath}
                className="profile-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <span className="profile-dropdown-icon profile-dropdown-icon--cyan">
                  <i className="bi bi-question-circle" />
                </span>
                <div className="profile-dropdown-item-text">
                  <span>FAQ</span>
                </div>
              </Link>
              {isHR && (
                <Link
                  to={timeSettingsPath}
                  className="profile-dropdown-item"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="profile-dropdown-icon profile-dropdown-icon--green">
                    <i className="bi bi-calendar3" />
                  </span>
                  <div className="profile-dropdown-item-text">
                    <span>Time Settings</span>
                  </div>
                </Link>
              )}
            </div>
            <div className="profile-dropdown-divider" />
            <div className="profile-dropdown-menu">
              <button
                type="button"
                className="profile-dropdown-item profile-dropdown-item--logout"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false)
                  handleLogout()
                }}
              >
                <span className="profile-dropdown-icon profile-dropdown-icon--red">
                  <i className="bi bi-box-arrow-right" />
                </span>
                <div className="profile-dropdown-item-text">
                  <span>Log Out</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-800 group outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate mt-1 group-hover:text-blue-600 transition-colors">
            {displayName}
          </p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {user?.role || 'Role'}
          </p>
        </div>

        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold overflow-hidden border-2 border-transparent group-hover:border-blue-100 dark:group-hover:border-blue-900/50 transition-all shadow-sm">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            initial
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
              to={profilePath}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <User size={18} />
              </div>
              User Profile
            </Link>

            <Link
              to={signatureSettingsPath}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <PenLine size={18} />
              </div>
              Signature Settings
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

            <Link
              to={faqPath}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all group"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                <HelpCircle size={18} />
              </div>
              FAQ
            </Link>

            {isHR && (
              <Link
                to={timeSettingsPath}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Calendar size={18} />
                </div>
                Time Settings
              </Link>
            )}
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
