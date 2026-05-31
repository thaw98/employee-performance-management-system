import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { usePermissionState } from '../../features/permission'

export interface MenuPermission {
  moduleKey: string
  actionKey?: string
}

export interface DashSubMenuItem {
  label: string
  path: string
  icon: React.ReactNode
  permission?: MenuPermission
}

export interface DashMenuItem {
  label: string
  path: string
  icon: React.ReactNode
  subItems?: DashSubMenuItem[]
  badge?: number | string
  onMouseEnter?: () => void
  onFocus?: () => void
  isActive?: (pathname: string, search: string) => boolean
  isSubActive?: (subPath: string, pathname: string, search: string) => boolean
  permission?: MenuPermission
}

export interface DashMenuSection {
  label: string
  items: DashMenuItem[]
}

interface DashMenuNavProps {
  sections: DashMenuSection[]
  isCollapsed: boolean
}

function defaultIsSubActive(subPath: string, pathname: string, search: string) {
  const [targetPathname, targetQuery] = subPath.split('?')
  if (pathname !== targetPathname) return false
  const currentParams = new URLSearchParams(search)
  if (!targetQuery) {
    return !currentParams.has('section') && !currentParams.has('action')
  }
  const targetParams = new URLSearchParams(targetQuery)
  return Array.from(targetParams.entries()).every(([key, value]) => currentParams.get(key) === value)
}

function defaultIsItemActive(item: DashMenuItem, pathname: string, search: string) {
  const itemPathname = item.path.split('?')[0]
  const currentPath = `${pathname}${search}`
  const hasActiveSub = Boolean(item.subItems?.some((sub) => defaultIsSubActive(sub.path, pathname, search)))
  const isOwnActive = currentPath === item.path || pathname === itemPathname
  if (item.label === 'Reports') return isOwnActive
  return isOwnActive || hasActiveSub
}

function shouldShowBadge(badge: DashMenuItem['badge']) {
  return badge != null && badge !== '' && badge !== 0
}

export function DashMenuNav({ sections, isCollapsed }: DashMenuNavProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isReady, hasPermission } = usePermissionState()
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  const canShow = (permission?: MenuPermission) => {
    if (!permission) return true
    if (!isReady) return false
    return hasPermission(permission.moduleKey, permission.actionKey ?? 'view')
  }

  const expandSection = (label: string) => {
    const next: Record<string, boolean> = {}
    for (const section of sections) {
      for (const menuItem of section.items) {
        if (menuItem.subItems?.length) {
          next[menuItem.label] = menuItem.label === label
        }
      }
    }
    setExpandedMenus(next)
  }

  const handleParentClick = (item: DashMenuItem, isExpanded: boolean) => {
    const firstChildPath = item.subItems![0].path
    const isOnFirstChild = item.isSubActive
      ? item.isSubActive(firstChildPath, location.pathname, location.search)
      : defaultIsSubActive(firstChildPath, location.pathname, location.search)

    if (isExpanded && isOnFirstChild) {
      setExpandedMenus((prev) => ({ ...prev, [item.label]: false }))
      return
    }

    if (!isExpanded) {
      expandSection(item.label)
    }
    navigate(firstChildPath)
  }

  const renderMenuItem = (item: DashMenuItem) => {
    if (!canShow(item.permission)) {
      return null
    }
    const renderItem = item.subItems
      ? { ...item, subItems: item.subItems.filter((sub) => canShow(sub.permission)) }
      : item
    const isActive = item.isActive
      ? item.isActive(location.pathname, location.search)
      : defaultIsItemActive(renderItem, location.pathname, location.search)
    const showBadge = shouldShowBadge(item.badge)

    if (renderItem.subItems?.length) {
      const hasActiveChild = renderItem.subItems.some((sub) =>
        item.isSubActive
          ? item.isSubActive(sub.path, location.pathname, location.search)
          : defaultIsSubActive(sub.path, location.pathname, location.search),
      )
      const isExpanded =
        expandedMenus[item.label] !== undefined ? expandedMenus[item.label] : isActive || hasActiveChild

      return (
        <li key={item.label} className={`nav-group${isExpanded ? ' expanded' : ''}${hasActiveChild ? ' has-active-child' : ''}`}>
          <button
            type="button"
            title={item.label}
            className={`nav-link nav-parent${isActive || hasActiveChild ? ' active' : ''}`}
            aria-expanded={isExpanded}
            onClick={() => handleParentClick(renderItem, isExpanded)}
            onMouseEnter={item.onMouseEnter}
            onFocus={item.onFocus}
          >
            <span className="nav-link-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
            {showBadge && !isCollapsed && (
              <span className="nav-link-badge">{item.badge}</span>
            )}
            {!isCollapsed && (
              <i
                className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} nav-chevron`}
                aria-hidden
              />
            )}
          </button>
          <ul className="nav-children">
            {renderItem.subItems.map((sub) => {
              const isSubActive = item.isSubActive
                ? item.isSubActive(sub.path, location.pathname, location.search)
                : defaultIsSubActive(sub.path, location.pathname, location.search)
              return (
                <li key={sub.path}>
                  <Link to={sub.path} className={`nav-link nav-child${isSubActive ? ' active' : ''}`}>
                    <span className="nav-link-icon">{sub.icon}</span>
                    <span className="sidebar-label">{sub.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </li>
      )
    }

    return (
      <li key={item.label}>
        <Link
          to={item.path}
          title={item.label}
          className={`nav-link${isActive ? ' active' : ''}`}
          onMouseEnter={item.onMouseEnter}
          onFocus={item.onFocus}
        >
          <span className="nav-link-icon">{item.icon}</span>
          <span className="sidebar-label">{item.label}</span>
          {showBadge && !isCollapsed && (
            <span className="nav-link-badge">{item.badge}</span>
          )}
        </Link>
      </li>
    )
  }

  return (
    <>
      {sections.map((section) => (
        <div key={section.label} className="dash-sidebar-section">
          {section.label && !isCollapsed && (
            <div className="dash-sidebar-section-label">{section.label}</div>
          )}
          <ul className="space-y-1">
            {section.items.map(renderMenuItem)}
          </ul>
        </div>
      ))}
    </>
  )
}
