import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks'

const PRIMARY = '#0855BF'

/** Same active treatment as Create Employee Account / Settings (sidebar consistency). */
const SIDEBAR_LINK_ACTIVE =
  'translate-x-1 bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/20'
const SIDEBAR_LINK_IDLE =
  'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'

type SubItem = { name: string; path: string; icon: string }
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
  const roleId = useAppSelector((s) => s.auth.user?.roleId)
  const isHr = roleId === 1 || role === 'HR'
  const isManager = roleId === 2 || roleId === 3 || role === 'DEPARTMENT_HEAD' || role === 'TEAM_HEAD'
  const location = useLocation()

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (path: string) => {
    setExpandedSections(prev => ({ ...prev, [path]: !prev[path] }))
  }

  const settingsPath = isHr ? '/hr/settings/profile' : (isManager ? '/manager/settings/profile' : '/employee/settings/profile')

  const navSections: NavSection[] = [
    {
      label: 'Main',
      items: [
        ...(isHr ? [{ name: 'HR Dashboard', path: '/hr/dashboard', icon: 'bi-speedometer2', end: true }] : []),
        ...(isHr
          ? [
              {
                name: 'Employee',
                path: '/hr/employees',
                icon: 'bi-person-badge',
                end: false,
                subItems: [
                  { name: 'Employee List', path: '/hr/employees', icon: 'bi-list-ul' },
                  { name: 'Create Employee Account', path: '/hr/employees/create-account', icon: 'bi-person-plus' },
                ],
              },
              {
                name: 'Positions',
                path: '/hr/positions',
                icon: 'bi-diagram-3',
                end: true,
              },
            ]
          : []),
        ...(isManager ? [{ name: 'Manager Dashboard', path: '/hr/manager-dashboard', icon: 'bi-people', end: false }] : []),
        { name: 'My Performance', path: '/hr/my-performance', icon: 'bi-person', end: false },
      ],
    },
    {
      label: 'Management',
      items: [
        { 
          name: 'Appraisals', 
          path: '/hr/appraisals-group', 
          icon: 'bi-clipboard-check', 
          end: false,
          subItems: [
            { name: 'Management', path: '/hr/appraisals', icon: 'bi-kanban' }
          ]
        },
        {
          name: '360 Feedback',
          path: '/hr/360-feedback',
          icon: 'bi-chat-dots',
          end: false,
          subItems: [
            ...(isHr ? [{ name: 'Criteria', path: '/hr/360-feedback/criteria', icon: 'bi-funnel' }] : []),
            { name: 'Give Feedback', path: '/hr/360-feedback/give', icon: 'bi-send' },
            { name: 'Get Feedback', path: '/hr/360-feedback/received', icon: 'bi-inbox' },
            { name: 'Feedback History', path: '/hr/360-feedback/history', icon: 'bi-clock-history' }
          ]
        },
        ...(isHr ? [{
          name: 'Self-Assessment',
          path: '/hr/self-assessment/templates',
          icon: 'bi-file-earmark-text',
          end: false,
          subItems: [
            { name: 'Template Management', path: '/hr/self-assessment/templates', icon: 'bi-sliders' },
            { name: 'Assignments overview', path: '/hr/self-assessment/assignments', icon: 'bi-clipboard-check' },
            { name: 'Assign Self-Assessment Forms', path: '/hr/self-assessment/assign-forms', icon: 'bi-send' },
            { name: 'Assigned Forms', path: '/hr/self-assessment/forms', icon: 'bi-inbox' },
            { name: 'Question Bank', path: '/hr/self-assessment/question-bank', icon: 'bi-book' },
            { name: 'Compliance Review', path: '/hr/self-assessment/reviews', icon: 'bi-list-check' },
            { name: 'Self Assessment Settings', path: '/hr/self-assessment/settings', icon: 'bi-gear' },
          ],
        }] : []),
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
    <aside className="z-20 hidden h-full w-64 shrink-0 border-r border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 md:flex md:flex-col transition-colors duration-300">
      <div
        className="flex h-16 items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 transition-colors duration-300"
        style={{ borderBottomColor: `${PRIMARY}15` }}
      >
        <Link
          to={isHr ? "/hr/dashboard" : (isManager ? "/hr/manager-dashboard" : "/hr/my-performance")}
          className="flex items-center gap-2.5 text-xl font-bold transition-opacity hover:opacity-90"
          style={{ color: PRIMARY }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            <i className="bi bi-hexagon-fill text-xl leading-none" />
          </div>
          <span className="tracking-tight dark:text-slate-200">ACE Data Systems</span>
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
                      <div className="ml-2 mt-1 space-y-1">
                        {item.subItems.map(subItem => (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            end
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 rounded-md pl-2 pr-2.5 py-2 text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-blue-600/15 dark:bg-blue-600/10 font-semibold text-blue-700 dark:text-blue-400 ring-1 ring-blue-600/20 dark:ring-blue-600/30'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <i
                                  className={`bi ${subItem.icon} text-sm opacity-80 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                                />
                                <span>{subItem.name}</span>
                              </>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 transition-colors duration-300">
        <NavLink
          to={settingsPath}
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
