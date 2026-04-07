import { Link, NavLink } from 'react-router-dom';

const PRIMARY = '#0855BF';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: 'bi-grid-1x2' },
  { name: 'Employees', path: '/admin/employees', icon: 'bi-people' },
  { name: 'Departments', path: '/admin/departments', icon: 'bi-buildings' },
  { name: 'Appraisals', path: '/admin/appraisals', icon: 'bi-file-earmark-text' },
  { name: 'Reports', path: '/admin/reports', icon: 'bi-graph-up' },
  { name: 'Settings', path: '/admin/settings', icon: 'bi-gear' },
];

export function AppSidebar() {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col h-full hidden md:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
      <div className="flex h-16 items-center px-6 border-b border-slate-200" style={{ borderBottomColor: `${PRIMARY}15` }}>
        <Link
          to="/admin/dashboard"
          className="text-xl font-bold flex items-center gap-2.5 transition-opacity hover:opacity-90"
          style={{ color: PRIMARY }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <i className="bi bi-hexagon-fill text-xl leading-none"></i>
          </div>
          <span className="tracking-tight">ACE Data Systems</span>
        </Link>
      </div>
      <div className="flex-1 py-6 px-4 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Overview
        </p>
        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <i className={`bi ${item.icon} text-lg transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-slate-100">
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-1">EPMS Version</p>
          <p className="text-sm font-semibold text-slate-700">v1.0.0-beta</p>
        </div>
      </div>
    </aside>
  );
}
