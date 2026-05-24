import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { DashSidebar } from './DashSidebar'
import { DashTopBar } from './DashTopBar'
import type { DashMenuItem } from './DashMenuNav'
import { usePersistentSidebarCollapse } from './usePersistentSidebarCollapse'

interface DashLayoutShellUser {
  id?: number | string | null
  name?: string | null
  email?: string | null
  role?: string | null
  roleId?: number | string | null
  profilePictureUrl?: string | null
}

interface DashLayoutShellProps {
  brandTitle?: string
  brandSubtitle?: string
  menuItems: DashMenuItem[]
  user?: DashLayoutShellUser | null
  searchPlaceholder?: string
  children: ReactNode
}

export function DashLayoutShell({
  brandTitle = 'EPMS',
  brandSubtitle = 'Performance System',
  menuItems,
  user,
  searchPlaceholder,
  children,
}: DashLayoutShellProps) {
  const { isSidebarCollapsed, toggleSidebarCollapsed } = usePersistentSidebarCollapse(user)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleSidebar = useCallback(() => {
    const isLg = window.innerWidth >= 1024
    if (isLg) {
      toggleSidebarCollapsed()
    } else {
      setIsMobileOpen((open) => !open)
    }
  }, [toggleSidebarCollapsed])

  useEffect(() => {
    const onResize = () => {
      const isLg = window.innerWidth >= 1024
      if (isLg) {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const shellClass = [
    'dash-shell',
    'dash-shell-bg',
    'flex',
    'h-screen',
    'min-h-screen',
    'w-full',
    'font-sans',
    isSidebarCollapsed ? 'sidebar-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClass}>
      <div
        id="dash-overlay"
        className={`lg:hidden${isMobileOpen ? '' : ' hidden'}`}
        onClick={toggleSidebar}
        onKeyDown={(e) => e.key === 'Escape' && setIsMobileOpen(false)}
        role="presentation"
      />

      <DashSidebar
        brandTitle={brandTitle}
        brandSubtitle={brandSubtitle}
        menuItems={menuItems}
        user={user}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileOpen}
      />

      <div id="dash-main-content">
        <DashTopBar onToggleSidebar={toggleSidebar} searchPlaceholder={searchPlaceholder} />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">{children}</div>
      </div>
    </div>
  )
}
