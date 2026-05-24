import type { ReactNode } from 'react'
import { resolveProfilePictureSrc } from '../../utils/mediaUrl'
import { DashMenuNav, type DashMenuItem } from './DashMenuNav'

interface DashSidebarUser {
  name?: string | null
  email?: string | null
  profilePictureUrl?: string | null
}

interface DashSidebarProps {
  brandTitle: string
  brandSubtitle: string
  menuItems: DashMenuItem[]
  user?: DashSidebarUser | null
  isCollapsed: boolean
  isMobileOpen: boolean
}

export function DashSidebar({
  brandTitle,
  brandSubtitle,
  menuItems,
  user,
  isCollapsed,
  isMobileOpen,
}: DashSidebarProps) {
  const avatarSrc = resolveProfilePictureSrc(user?.profilePictureUrl)
  const initial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'

  const navSection: ReactNode = (
    <nav className="dash-sidebar-nav">
      <DashMenuNav items={menuItems} isCollapsed={isCollapsed} />
    </nav>
  )

  return (
    <aside
      id="dash-sidebar"
      className={isMobileOpen ? 'sidebar-open' : ''}
      aria-label="Main navigation"
    >
      <div className="dash-sidebar-brand">
        <div className="dash-sidebar-brand-icon">
          <img src="/ace-logo.png" alt="ACE Data Systems" className="dash-sidebar-brand-logo" />
        </div>
        <div className="sidebar-label min-w-0">
          <span className="dash-sidebar-brand-title">{brandTitle}</span>
          <span className="dash-sidebar-brand-subtitle">{brandSubtitle}</span>
        </div>
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
            <p className="text-[12px] text-[#64748b] truncate">{user?.email || initial}</p>
          </div>
          <i className="sidebar-label bi bi-three-dots-vertical text-[#64748b]" />
        </div>
      </div>
    </aside>
  )
}
