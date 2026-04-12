import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks'

const PRIMARY = '#0855BF'

/** Same active treatment as Create Employee Account / Settings (sidebar consistency). */
const SIDEBAR_LINK_ACTIVE =
  'translate-x-1 bg-blue-600 text-white shadow-md shadow-blue-200'
const SIDEBAR_LINK_IDLE =
  'text-slate-600 hover:bg-white hover:text-blue-600'

type SubItem = { name: string; path: string }
type NavItem = {
  name: string;
  path: string;
  icon: string;
  end: boolean;
  subItems?: SubItem[]
}
type NavSection = { label: string; items: NavItem[] }

export function AppSidebar() {
  const role = useAppSelector((s) => s.auth.user?.role)
  const isHr = role === 'HR'
  const isManager = role === 'DEPARTMENT_HEAD' || role === 'TEAM_HEAD'
  const location = useLocation()

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (path: string) => {
    setExpandedSections(prev => ({ ...prev, [path]: !prev[path] }))
  }

  const navSections: NavSection[] = [
    {
      label: 'Main',
      items: [
        ...(isHr ? [{ name: 'HR Dashboard', path: '/hr/dashboard', icon: 'bi-speedometer2', end: true }] : []),
        ...(isManager ? [{ name: 'Manager Dashboard', path: '/hr/manager-dashboard', icon: 'bi-people', end: false }] : []),
        { name: 'My Performance', path: '/hr/my-performance', icon: 'bi-person', end: false },
      ],
    },
    {
      label: 'Management',
      items: [
        { name: 'Performance Appraisals', path: '/hr/appraisals', icon: 'bi-clipboard-check', end: false },
        {
          name: '360° Feedback',
          path: '/hr/360-feedback',
          icon: 'bi-chat-dots',
          end: false,
          subItems: [
            { name: 'Criteria', path: '/hr/360-feedback/criteria' },
            { name: 'Give Feedback', path: '/hr/360-feedback/give' },
            { name: 'Get Feedback', path: '/hr/360-feedback/get' },
            { name: 'History', path: '/hr/360-feedback/history' }
          ]
        },
        { name: 'PIP Monitoring', path: '/hr/pip-monitoring', icon: 'bi-exclamation-triangle', end: false },
      ],
    },
    {
      label: 'Analytics',
      items: [
        { name: 'Goals & KPIs', path: '/hr/goals', icon: 'bi-bullseye', end: false },
        { name: 'Reports Center', path: '/hr/reports', icon: 'bi-pie-chart', end: false },
      ],
    },
  ]

  return (
    <aside className="z-20 hidden h-full w-64 shrink-0 border-r border-slate-200/80 bg-slate-50 md:flex md:flex-col">
      <div
        className="flex h-16 items-center border-b border-slate-200 bg-slate-50 px-6"
        style={{ borderBottomColor: `${PRIMARY}15` }}
      >
        <Link
          to={isHr ? "/hr/dashboard" : (isManager ? "/hr/manager-dashboard" : "/hr/my-performance")}
          className="flex items-center gap-2.5 text-xl font-bold transition-opacity hover:opacity-90"
          style={{ color: PRIMARY }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <i className="bi bi-hexagon-fill text-xl leading-none" />
          </div>
          <span className="tracking-tight">ACE Data Systems</span>
        </Link>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto px-4 py-6">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-2">
            <div className="px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {section.label}
            </div>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActiveOrChild = location.pathname.startsWith(item.path)
                const isExpanded = expandedSections[item.path] !== undefined ? expandedSections[item.path] : isActiveOrChild

                return (
                  <div key={item.path}>
                    {item.subItems ? (
                      <button
                        onClick={() => toggleSection(item.path)}
                        className={`w-full group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActiveOrChild
                            ? SIDEBAR_LINK_ACTIVE
                            : SIDEBAR_LINK_IDLE
                          }`}
                      >
                        <i
                          className={`bi ${item.icon} text-base transition-colors ${isActiveOrChild ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                            }`}
                        />
                        <span className="flex-1 text-left">{item.name}</span>
                        <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} text-xs opacity-50 transition-transform`} />
                      </button>
                    ) : (
                      <NavLink
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                          `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                            ? SIDEBAR_LINK_ACTIVE
                            : SIDEBAR_LINK_IDLE
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <i
                              className={`bi ${item.icon} text-base transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                                }`}
                            />
                            <span className="flex-1">{item.name}</span>
                          </>
                        )}
                      </NavLink>
                    )}

                    {item.subItems && isExpanded && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.subItems.map(subItem => (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            end
                            className={({ isActive }) =>
                              `block rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-blue-600/15 font-semibold text-blue-700 ring-1 ring-blue-600/20'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                              }`
                            }
                          >
                            {subItem.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {section.label === 'Management' && isHr ? (
                <NavLink
                  to="/hr/employee-account/create"
                  end
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                      ? SIDEBAR_LINK_ACTIVE
                      : SIDEBAR_LINK_IDLE
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <i
                        className={`bi bi-person-plus text-base transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                          }`}
                      />
                      Create Employee Account
                    </>
                  )}
                </NavLink>
              ) : null}
            </nav>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200/80 bg-slate-50 p-4">
        <NavLink
          to="/hr/settings/profile"
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
              ? SIDEBAR_LINK_ACTIVE
              : SIDEBAR_LINK_IDLE
            }`
          }
        >
          {({ isActive }) => (
            <>
              <i
                className={`bi bi-gear text-base transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                  }`}
              />
              Settings
            </>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
