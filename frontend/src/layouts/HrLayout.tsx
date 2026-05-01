import React from 'react';
import {
  Users,
  Target,
  Award,
  Calendar,
  BarChart,
  LayoutDashboard,
  ChevronDown,
  ShieldCheck,
  Search,
  RefreshCcw,
  Zap,
  Building2,
  Briefcase,
  List,
  UserPlus,
  SlidersHorizontal,
  ListChecks,
  LayoutGrid,
  Inbox,
  ListFilter,
  Send,
  History,
  Layers,
  FileText,
  BookOpen
} from 'lucide-react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { logout } from '../features/auth/authSlice';
import { resolveProfilePictureSrc } from '../utils/mediaUrl';
import { useGetProfileQuery } from '../features/user/userApi';
import { pipApi } from '../features/pip/pipApi';
import { ProfileDropdown } from '../components/layout/ProfileDropdown';
import { NotificationBell } from '../components/common/NotificationBell';

const HrLayout: React.FC = () => {
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { data: profileResponse } = useGetProfileQuery();
  const user = profileResponse?.data || authUser;
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

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/hr/dashboard' },
    {
      icon: <Users size={20} />,
      label: 'Employee',
      path: '/hr/employees',
      subItems: [
        { label: 'Employee List', path: '/hr/employees', icon: <List size={16} className="shrink-0" /> },
        { label: 'Create Employee Account', path: '/hr/employees/create-account', icon: <UserPlus size={16} className="shrink-0" /> }
      ]
    },
    { icon: <Building2 size={20} />, label: 'Department', path: '/hr/departments' },
    { icon: <Briefcase size={20} />, label: 'Positions', path: '/hr/positions' },
    { icon: <Layers size={20} />, label: 'Level Codes', path: '/hr/level-codes' },
    {
      icon: <Target size={20} />,
      label: 'Performance',
      path: '/hr/kpi-management',
      subItems: [
        { label: 'KPI Modeler', path: '/hr/kpi-management', icon: <SlidersHorizontal size={16} className="shrink-0" /> },
        { label: 'Assigned List', path: '/hr/kpi-assigned', icon: <ListChecks size={16} className="shrink-0" /> },
        { label: 'Category List', path: '/hr/kpi-categories', icon: <LayoutGrid size={16} className="shrink-0" /> },
        { label: 'History', path: '/hr/kpi-history', icon: <History size={16} className="shrink-0" /> }
      ]
    },
    {
      icon: <Award size={20} />,
      label: 'Appraisals',
      path: '/hr/appraisals',
      subItems: [
        { label: 'Management', path: '/hr/appraisals', icon: <LayoutGrid size={16} className="shrink-0" /> },
        { label: 'Review Submissions', path: '/hr/appraisals/submissions', icon: <Inbox size={16} className="shrink-0" /> }
      ]
    },
    {
      icon: <RefreshCcw size={20} />,
      label: '360 Feedback',
      path: '/hr/360-feedback/criteria',
      subItems: [
        { label: 'Criteria', path: '/hr/360-feedback/criteria', icon: <ListFilter size={16} className="shrink-0" /> },
        { label: 'Give Feedback', path: '/hr/360-feedback/give', icon: <Send size={16} className="shrink-0" /> },
        { label: 'Get Feedback', path: '/hr/360-feedback/received', icon: <Inbox size={16} className="shrink-0" /> },
        { label: 'Feedback History', path: '/hr/360-feedback/history', icon: <History size={16} className="shrink-0" /> }
      ]
    },
    { icon: <Zap size={20} />, label: 'PIP Management', path: '/hr/pip-monitoring' },
    {
      icon: <FileText size={20} />,
      label: 'Self-Assessment',
      path: '/hr/self-assessment/templates',
      subItems: [
        { label: 'Template Management', path: '/hr/self-assessment/templates', icon: <SlidersHorizontal size={16} className="shrink-0" /> },
        { label: 'Assigned Forms', path: '/hr/self-assessment/forms', icon: <Inbox size={16} className="shrink-0" /> },
        { label: 'Question Bank', path: '/hr/self-assessment/question-bank', icon: <BookOpen size={16} className="shrink-0" /> },
        { label: 'Compliance Review', path: '/hr/self-assessment/reviews', icon: <ListChecks size={16} className="shrink-0" /> }
      ]
    },
    { icon: <Calendar size={20} />, label: 'Meetings', path: '/hr/meetings' },
    { icon: <BarChart size={20} />, label: 'Reports', path: '/hr/reports' }
  ];

  return (
    <div className="flex h-screen bg-transparent font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300 print:hidden">
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
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold overflow-hidden shadow-inner">
              {user?.profilePictureUrl ? (
                 <img src={resolveProfilePictureSrc(user.profilePictureUrl)} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                 user?.name?.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate uppercase mt-1">{user?.name}</h4>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate">CEO</p>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[8px] font-black uppercase">
                  HR
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 dark:bg-slate-900 transition-colors duration-300">
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
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
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
                    <div className="pl-7 pr-3 space-y-1 mt-1">
                      {item.subItems.map((subItem) => {
                        const isSubActive = location.pathname === subItem.path;

                        return (
                          <Link
                            key={subItem.label}
                            to={subItem.path}
                            className={`flex items-center gap-2.5 pl-2 pr-2.5 py-2 text-sm font-semibold rounded-lg transition-colors ${isSubActive
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                              }`}
                          >
                            <span className={isSubActive ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-400'}>
                              {subItem.icon}
                            </span>
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
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                <span className={isActive ? 'text-emerald-700' : 'text-slate-400'}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <LayoutDashboard size={20} className="rotate-180" />
            Sign Out
          </button>
          <div className="mt-4 px-4 text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
            EPMS v1.0 • 2026
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-transparent transition-colors duration-300">
        {/* Top Header */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between transition-colors duration-300 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h2>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 border border-transparent focus-within:border-emerald-200 dark:focus-within:border-emerald-900/50 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
              <Search size={18} className="text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Organizational search..."
                className="bg-transparent border-none focus:ring-0 text-sm font-medium ml-2 w-48 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            <NotificationBell />

            <ProfileDropdown />
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
