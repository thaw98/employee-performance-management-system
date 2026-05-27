import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { resolveProfilePictureSrc } from '../../utils/mediaUrl'
import { DashMenuNav, type DashMenuSection } from './DashMenuNav'

interface DashSidebarUser {
  name?: string | null
  role?: string | null
  profilePictureUrl?: string | null
}

interface DashSidebarProps {
  brandTitle: string
  brandSubtitle: string
  homePath?: string
  menuSections: DashMenuSection[]
  user?: DashSidebarUser | null
  isCollapsed: boolean
  isMobileOpen: boolean
}

export function DashSidebar({
  brandTitle,
  brandSubtitle,
  homePath,
  menuSections,
  user,
  isCollapsed,
  isMobileOpen,
}: DashSidebarProps) {
  const avatarSrc = resolveProfilePictureSrc(user?.profilePictureUrl)
  const displayRole = (user?.role || 'Role').toUpperCase()

  const navSection: ReactNode = (
    <nav className="dash-sidebar-nav">
      <DashMenuNav sections={menuSections} isCollapsed={isCollapsed} />
    </nav>
  )

  return (
    <aside
      id="dash-sidebar"
      className={isMobileOpen ? 'sidebar-open' : ''}
      aria-label="Main navigation"
    >
      <div className="dash-sidebar-brand">
        {homePath ? (
          <Link
            to={homePath}
            className="dash-sidebar-brand-link"
            aria-label="Go to dashboard home"
          >
            <div className="dash-sidebar-brand-icon">
              <img src="/ace-logo.png" alt="ACE Data Systems" className="dash-sidebar-brand-logo" />
            </div>
            <div className="sidebar-label min-w-0">
              <span className="dash-sidebar-brand-title">{brandTitle}</span>
              <span className="dash-sidebar-brand-subtitle">{brandSubtitle}</span>
            </div>
          </Link>
        ) : (
          <>
            <div className="dash-sidebar-brand-icon">
              <img src="/ace-logo.png" alt="ACE Data Systems" className="dash-sidebar-brand-logo" />
            </div>
            <div className="sidebar-label min-w-0">
              <span className="dash-sidebar-brand-title">{brandTitle}</span>
              <span className="dash-sidebar-brand-subtitle">{brandSubtitle}</span>
            </div>
          </>
        )}
      </div>

      {navSection}

      <div className="dash-sidebar-user">
        <div className="dash-sidebar-user-inner">
          <div className="dash-sidebar-user-avatar">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" />
            ) : (
              <i className="bi bi-person-fill" />
            )}
          </div>
          <div className="sidebar-label min-w-0 flex-1">
            <p className="text-sm font-semibold truncate text-[#1e293b]">{user?.name || 'User'}</p>
            <p className="text-[12px] text-[#64748b] truncate">{displayRole}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
