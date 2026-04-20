import { useState, type ReactElement } from 'react'
import {
  Users,
  Target,
  Award,
  Calendar,
  BarChart,
  LayoutDashboard,
  Bell,
  ChevronDown,
  ShieldCheck,
  Search,
  UserPlus,
  RefreshCcw,
  Zap,
  ClipboardList,
} from 'lucide-react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../app/hooks'
import { logout } from '../features/auth/authSlice'

type MenuSubItem = {
  label: string
  path: string
}

type MenuItem = {
  icon: ReactElement
  label: string
  path: string
  exact?: boolean
  subItems?: MenuSubItem[]
}

function initialsFromName(name: string | undefined) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function HrLayout() {
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const toggleExpand = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const menuItems: MenuItem[] = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/hr/dashboard', exact: true },
    {
      icon: <UserPlus size={20} />,
      label: 'Create Employee Account',
      path: '/hr/employees/create-account',
      exact: true,
    },
    { icon: <Users size={20} />, label: 'Employees', path: '/hr/employees' },
    { icon: <Target size={20} />, label: 'KPI Management', path: '/hr/kpi-mgmt' },
    {
      icon: <ClipboardList size={20} />,
      label: 'Self Assessments',
      path: '/hr/assessments',
      subItems: [
        { label: 'Compliance Review', path: '/hr/assessments' },
        { label: 'Assessment Questions', path: '/hr/assessment-subitems' },
      ],
    },
    {
      icon: <Award size={20} />,
      label: 'Appraisals',
      path: '/hr/appraisals',
      subItems: [{ label: 'Management', path: '/hr/appraisals' }],
    },
    {
      icon: <RefreshCcw size={20} />,
      label: '360° Feedback',
      path: '/hr/360-feedback',
      subItems: [
        { label: 'Criteria', path: '/hr/360-feedback/criteria' },
        { label: 'Give Feedback', path: '/hr/360-feedback/give' },
        { label: 'Get Feedback', path: '/hr/360-feedback/get' },
      ],
    },
    { icon: <Zap size={20} />, label: 'PIP Management', path: '/hr/pip' },
    { icon: <Calendar size={20} />, label: 'Meetings', path: '/hr/meetings' },
    { icon: <BarChart size={20} />, label: 'Reports', path: '/hr/reports' },
  ]

  const initial = initialsFromName(user?.name)

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="bg-[#115e59] p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/20 backdrop-blur-md">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase leading-none tracking-tight">EPMS</h1>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/50">Performance System</p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-bold text-slate-500">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="mt-1 truncate text-sm font-bold uppercase text-slate-900">{user?.name ?? 'HR User'}</h4>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-black uppercase text-emerald-700">
                  HR
                </span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map((item) => {
            const hasSubItems = Boolean(item.subItems?.length)
            const isDirectActive = item.exact
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
            const isSubActive =
              item.subItems?.some(
                (subItem) => location.pathname === subItem.path || location.pathname.startsWith(`${subItem.path}/`),
              ) ?? false
            const isActive = isDirectActive || isSubActive

            if (hasSubItems && item.subItems) {
              const isExpanded = expandedMenus[item.label] ?? isActive
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.label)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-emerald-700' : 'text-slate-400'}>{item.icon}</span>
                      {item.label}
                    </div>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${isExpanded ? 'rotate-180' : ''} ${
                        isActive ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-1 space-y-1 pl-11 pr-4">
                      {item.subItems.map((subItem) => {
                        const isCurrentSub =
                          location.pathname === subItem.path || location.pathname.startsWith(`${subItem.path}/`)
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                              isCurrentSub
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={isActive ? 'text-emerald-700' : 'text-slate-400'}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-slate-400 transition-colors hover:text-red-500"
          >
            <LayoutDashboard size={20} className="rotate-180" />
            Sign Out
          </button>

          <div className="mt-4 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-300">EPMS v1.0 • 2026</div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">HR</h2>
            <p className="text-xs font-bold text-slate-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="group relative flex items-center rounded-full border border-transparent bg-slate-100 px-4 py-2 transition-all focus-within:border-emerald-200 focus-within:bg-white">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="ml-2 w-48 border-none bg-transparent text-sm font-medium focus:ring-0"
              />
            </div>

            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center text-slate-400 transition-colors hover:text-emerald-600"
            >
              <Bell size={22} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
            </button>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="mt-1 truncate text-xs font-bold uppercase text-slate-900">{user?.name}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">HR</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                {initial}
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
