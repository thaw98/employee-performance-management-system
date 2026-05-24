import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export interface DashSubMenuItem {
  label: string
  path: string
  icon: React.ReactNode
}

export interface DashMenuItem {
  label: string
  path: string
  icon: React.ReactNode
  subItems?: DashSubMenuItem[]
  onMouseEnter?: () => void
  onFocus?: () => void
  isActive?: (pathname: string, search: string) => boolean
  isSubActive?: (subPath: string, pathname: string, search: string) => boolean
}

interface DashMenuNavProps {
  items: DashMenuItem[]
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

export function DashMenuNav({ items, isCollapsed }: DashMenuNavProps) {
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setExpandedMenus({})
  }, [location.pathname, location.search])

  const toggleExpand = (label: string, currentlyExpanded: boolean) => {
    if (currentlyExpanded) {
      setExpandedMenus((prev) => ({ ...prev, [label]: false }))
      return
    }
    const next: Record<string, boolean> = {}
    for (const menuItem of items) {
      if (menuItem.subItems?.length) {
        next[menuItem.label] = menuItem.label === label
      }
    }
    setExpandedMenus(next)
  }

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const isActive = item.isActive
          ? item.isActive(location.pathname, location.search)
          : defaultIsItemActive(item, location.pathname, location.search)

        if (item.subItems?.length) {
          const hasActiveChild = item.subItems.some((sub) =>
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
                onClick={() => toggleExpand(item.label, isExpanded)}
                onMouseEnter={item.onMouseEnter}
                onFocus={item.onFocus}
              >
                <span className="nav-link-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
                {!isCollapsed && (
                  <i
                    className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} nav-chevron`}
                    aria-hidden
                  />
                )}
              </button>
              <ul className="nav-children">
                {item.subItems.map((sub) => {
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
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
