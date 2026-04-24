import React from 'react';
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
  RefreshCcw,
  Zap,
  ClipboardList,
  Building2,
  Briefcase
} from 'lucide-react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { logout } from '../store/authSlice';
import { pipApi } from '../features/pip/pipApi';

const HrLayout: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const prefetchPips = pipApi.usePrefetch('getPips');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const [expandedMenus, setExpandedMenus] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isHrAdmin = user?.roleId === 1;

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/hr/dashboard' },
    isHrAdmin
      ? {
        icon: <Users size={20} />,
        label: 'Employees',
        path: '/hr/employees',
        subItems: [
          { label: 'Employee List', path: '/hr/employees' },
          { label: 'Create Employee Account', path: '/hr/employees/create-account' }
        ]

      }
      : { icon: <Users size={20} />, label: 'Employees', path: '/hr/employees' },
    { icon: <Building2 size={20} />, label: 'Department', path: '/hr/departments' },
    { icon: <Briefcase size={20} />, label: 'Positions', path: '/hr/positions' },
    {
      icon: <Target size={20} />,
      label: 'Performance',
      path: '/hr/kpi-management',
      subItems: [
        { label: 'KPI Modeler', path: '/hr/kpi-management' },
        { label: 'Assigned List', path: '/hr/kpi-assigned' }
      ]
    },
    {
      icon: <ClipboardList size={20} />,
      label: 'Self Assessments',
      path: '/hr/assessments',
      subItems: [
        { label: 'My Assessment', path: '/hr/my-assessment' },
        { label: 'Compliance Review', path: '/hr/assessments' },
        { label: 'Question', path: '/hr/assessment-subitems' }
      ]
    },
    {
      icon: <Award size={20} />,
      label: 'Appraisals',
      path: '/hr/appraisals',
      subItems: [{ label: 'Management', path: '/hr/appraisals' },
      { label: "Review Submissions", path: '/hr/AppraisalSubmissionsPage' }]
    },
    {
      icon: <RefreshCcw size={20} />,
      label: '360° Feedback',
      path: '/hr/360-feedback/criteria',
      subItems: [
        { label: 'Criteria', path: '/hr/360-feedback/criteria' },
        { label: 'Give Feedback', path: '/hr/360-feedback/give' },
        { label: 'Get Feedback', path: '/hr/360-feedback/received' },
        { label: 'History', path: '/hr/360-feedback/history' }
      ]
    },
    { icon: <Zap size={20} />, label: 'PIP Management', path: '/hr/pip-monitoring' },
    { icon: <Calendar size={20} />, label: 'Meetings', path: '/hr/meetings' },
    { icon: <BarChart size={20} />, label: 'Reports', path: '/hr/reports' }
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Brand Header */}
        <div className="p-6 bg-[#115e59] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none uppercase">EPMS</h1>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">
                Performance System
              </p>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold overflow-hidden">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 truncate uppercase mt-1">{user?.name}</h4>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase truncate">CEO</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase">
                  HR
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.subItems && item.subItems.some((sub) => location.pathname.startsWith(sub.path)));

            if (item.subItems) {
              const isExpanded =
                expandedMenus[item.label] !== undefined ? expandedMenus[item.label] : isActive;

              return (
                <div key={item.label} className="space-y-1">
                  <div
                    className={`w-full flex items-center justify-between gap-2 rounded-xl text-sm font-bold transition-all ${isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <Link to={item.path || '#'} className="flex-1 flex items-center gap-3 px-4 py-3">
                      <span className={isActive ? 'text-emerald-700' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleExpand(item.label);
                      }}
                      className="p-3 text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pl-11 pr-4 space-y-1 mt-1">
                      {item.subItems.map((subItem) => {
                        const isSubActive = location.pathname === subItem.path;

                        return (
                          <Link
                            key={subItem.label}
                            to={subItem.path}
                            className={`block px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${isSubActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                onMouseEnter={item.path === '/hr/pip-monitoring' ? () => prefetchPips() : undefined}
                onFocus={item.path === '/hr/pip-monitoring' ? () => prefetchPips() : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <span className={isActive ? 'text-emerald-700' : 'text-slate-400'}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors"
          >
            <LayoutDashboard size={20} className="rotate-180" />
            Sign Out
          </button>
          <div className="mt-4 px-4 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
            EPMS v1.0 • 2026
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
            <p className="text-xs font-bold text-slate-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group flex items-center bg-slate-100 rounded-full px-4 py-2 border border-transparent focus-within:border-emerald-200 focus-within:bg-white transition-all">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Organizational search..."
                className="bg-transparent border-none focus:ring-0 text-sm font-medium ml-2 w-48"
              />
            </div>

            <button
              type="button"
              className="relative w-10 h-10 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors"
            >
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 truncate uppercase mt-1">{user?.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">CEO</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                {user?.name?.charAt(0)}
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default HrLayout;
