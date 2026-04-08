import { Link, NavLink } from 'react-router-dom'

const PRIMARY = '#0855BF'

/** Matches reference: MAIN / MANAGEMENT / ANALYTICS + Settings footer */
const navSections = [
  {
    label: 'Main',
    items: [
      { name: 'Executive View', path: '/admin/dashboard', icon: 'bi-speedometer2', end: true },
      { name: 'Manager Dashboard', path: '/admin/manager-dashboard', icon: 'bi-people', end: false },
      { name: 'My Performance', path: '/admin/my-performance', icon: 'bi-person', end: false },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: 'Performance Appraisals', path: '/admin/appraisals', icon: 'bi-clipboard-check', end: false },
      { name: '360° Feedback', path: '/admin/360-feedback', icon: 'bi-chat-dots', end: false },
      { name: 'PIP Monitoring', path: '/admin/pip-monitoring', icon: 'bi-exclamation-triangle', end: false },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { name: 'Goals & KPIs', path: '/admin/goals', icon: 'bi-bullseye', end: false },
      { name: 'Reports Center', path: '/admin/reports', icon: 'bi-pie-chart', end: false },
    ],
  },
] as const

export function AppSidebar() {
  return (
    <aside className="z-20 hidden h-full w-64 shrink-0 border-r border-slate-200/80 bg-slate-50 md:flex md:flex-col">
      <div
        className="flex h-16 items-center border-b border-slate-200 bg-slate-50 px-6"
        style={{ borderBottomColor: `${PRIMARY}15` }}
      >
        <Link
          to="/admin/dashboard"
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
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                      ? 'translate-x-1 bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'text-slate-600 hover:bg-white hover:text-blue-600'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <i
                        className={`bi ${item.icon} text-base transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                          }`}
                      />
                      {item.name}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200/80 bg-slate-50 p-4">
        <NavLink
          to="/admin/settings/profile"
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
              ? 'translate-x-1 bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'text-slate-600 hover:bg-white hover:text-blue-600'
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
