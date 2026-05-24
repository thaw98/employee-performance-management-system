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
  ClipboardList,
  HelpCircle
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
import { usePersistentSidebarCollapse } from '../components/layout/usePersistentSidebarCollapse';

const HrLayout: React.FC = () => {
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { data: profileResponse } = useGetProfileQuery();
  const user = profileResponse?.data || authUser;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const prefetchPips = pipApi.usePrefetch('getPips');
  const { isSidebarCollapsed, toggleSidebarCollapsed } = usePersistentSidebarCollapse(user);

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
      label: 'Key Performance Indicator (KPI)',
      path: '/hr/kpi-management',
      subItems: [
        { label: 'KPI Modeler', path: '/hr/kpi-management', icon: <SlidersHorizontal size={16} className="shrink-0" /> },
        { label: 'Assigned List', path: '/hr/kpi-assigned', icon: <ListChecks size={16} className="shrink-0" /> },
        //{ label: 'Category List', path: '/hr/kpi-categories', icon: <LayoutGrid size={16} className="shrink-0" /> },
        { label: 'History', path: '/hr/kpi-history', icon: <History size={16} className="shrink-0" /> },
        { label: 'Audit Logs', path: '/hr/kpi-audit-logs', icon: <ClipboardList size={16} className="shrink-0" /> }
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
    {
      icon: <Zap size={20} />,
      label: 'PIP',
      path: '/hr/pip-monitoring',
      subItems: [
        { label: 'PIP Management', path: '/hr/pip-monitoring', icon: <List size={16} className="shrink-0" /> },
        { label: 'PIP Note History', path: '/hr/pip-notes', icon: <FileText size={16} className="shrink-0" /> }
      ]
    },
    {
      icon: <FileText size={20} />,
      label: 'Self-Assessment',
      path: '/hr/self-assessment/templates',
      subItems: [
        { label: 'Template Management', path: '/hr/self-assessment/templates', icon: <SlidersHorizontal size={16} className="shrink-0" /> },
        { label: 'Assignments', path: '/hr/self-assessment/assignments', icon: <ClipboardList size={16} className="shrink-0" /> },
        { label: 'Assigned Forms', path: '/hr/self-assessment/forms', icon: <Inbox size={16} className="shrink-0" /> },

        { label: 'Review Submissions', path: '/hr/self-assessment/review-queue', icon: <ListChecks size={16} className="shrink-0" /> },
        { label: 'History', path: '/hr/self-assessment/history', icon: <History size={16} className="shrink-0" /> },
        { label: 'Audit Logs', path: '/hr/self-assessment/audit-logs', icon: <ClipboardList size={16} className="shrink-0" /> },
      ]
    },
    {
      icon: <Calendar size={20} />,
      label: 'Meetings',
      path: '/hr/meetings?section=schedule',
      subItems: [
        { label: 'Schedule Meeting', path: '/hr/meetings?section=schedule', icon: <Calendar size={16} className="shrink-0" /> },
        { label: 'Meeting History', path: '/hr/meetings?section=history', icon: <History size={16} className="shrink-0" /> }
      ]
    },
    {
      icon: <BarChart size={20} />,
      label: 'Reports',
      path: '/hr/reports',
      subItems: [
        { label: 'Performance Report', path: '/hr/performance-reports', icon: <Award size={16} className="shrink-0" /> },
        { label: 'PIP Report', path: '/hr/reports', icon: <Zap size={16} className="shrink-0" /> },
        { label: 'KPI Report', path: '/hr/kpi-reports', icon: <BarChart size={16} className="shrink-0" /> },
        { label: 'Feedback Report', path: '/hr/reports/feedback', icon: <RefreshCcw size={16} className="shrink-0" /> },
        { label: 'Appraisal Report', path: '/hr/reports/appraisal', icon: <Award size={16} className="shrink-0" /> },
        { label: 'Self-Assessment Report', path: '/hr/reports/self-assessment', icon: <FileText size={16} className="shrink-0" /> }
      ]
    },
    { icon: <HelpCircle size={20} />, label: 'FAQ Support', path: '/hr/settings/faq-support' }
  ];

  return (
    <div className="flex h-screen bg-transparent font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 print:hidden`}>
        {/* Brand Header */}
        <div className={`${isSidebarCollapsed ? 'p-4' : 'p-6'} bg-[#115e59] text-white`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 transition-colors hover:bg-white/30"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ShieldCheck size={24} />
            </button>
            {!isSidebarCollapsed && <div>
              <h1 className="font-black text-xl tracking-tight leading-none uppercase">EPMS</h1>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">
                Performance System
              </p>
            </div>}
          </div>
        </div>

        {/* User Profile Card */}
        <div className={`${isSidebarCollapsed ? 'p-4' : 'p-6'} border-b border-slate-100 dark:border-slate-800`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold overflow-hidden shadow-inner">
              {user?.profilePictureUrl ? (
                <img src={resolveProfilePictureSrc(user.profilePictureUrl)} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                user?.name?.charAt(0)
              )}
            </div>
            {!isSidebarCollapsed && <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate uppercase mt-1">{user?.name}</h4>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate">CEO</p>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[8px] font-black uppercase">
                  HR
                </span>
              </div>
            </div>}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`${isSidebarCollapsed ? 'p-3' : 'p-4'} flex-1 overflow-y-auto space-y-1 dark:bg-slate-900 transition-colors duration-300`}>
          {menuItems.map((item) => {
            const currentPath = `${location.pathname}${location.search}`;
            const itemPathname = item.path.split('?')[0];
            const matchesPath = (targetPath: string) => {
              const [targetPathname, targetQuery] = targetPath.split('?');
              if (location.pathname !== targetPathname) return false;
              const currentParams = new URLSearchParams(location.search);
              if (!targetQuery) {
                return !currentParams.has('section') && !currentParams.has('action');
              }

              const targetParams = new URLSearchParams(targetQuery);
              return Array.from(targetParams.entries()).every(
                ([key, value]) => currentParams.get(key) === value,
              );
            };
            const hasActiveSubItem = Boolean(item.subItems?.some((sub) => matchesPath(sub.path)));
            const isOwnActive = currentPath === item.path || location.pathname === itemPathname;
            const isActive =
              item.label === 'Reports'
                ? isOwnActive
                : isOwnActive || hasActiveSubItem;

            if (item.subItems) {
              const isExpanded =
                expandedMenus[item.label] !== undefined ? expandedMenus[item.label] : isActive || hasActiveSubItem;

              return (
                <div key={item.label} className="space-y-1">
                  <div
                    className={`w-full flex items-center justify-between gap-2 rounded-xl text-sm font-bold transition-all ${isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                  >
                    <Link
                      to={item.path || '#'}
                      title={item.label}
                      className={`${isSidebarCollapsed ? 'h-12 w-full justify-center px-0' : 'flex-1 gap-3 px-4 py-3'} flex items-center`}
                    >
                      <span className={`${isActive ? 'text-emerald-700' : 'text-slate-400'} flex h-5 w-5 shrink-0 items-center justify-center`}>
                        {item.icon}
                      </span>
                      {!isSidebarCollapsed && item.label}
                    </Link>

                    {!isSidebarCollapsed && <button
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
                    </button>}
                  </div>

                  {isExpanded && !isSidebarCollapsed && (
                    <div className="pl-7 pr-3 space-y-1 mt-1">
                      {item.subItems.map((subItem) => {
                        const isSubActive = matchesPath(subItem.path);

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
                title={item.label}
                onMouseEnter={item.path === '/hr/pip-monitoring' ? () => prefetchPips() : undefined}
                onFocus={item.path === '/hr/pip-monitoring' ? () => prefetchPips() : undefined}
                className={`flex items-center ${isSidebarCollapsed ? 'h-12 justify-center px-0' : 'gap-3 px-4 py-3'} rounded-xl text-sm font-bold transition-all ${isActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                <span className={`${isActive ? 'text-emerald-700' : 'text-slate-400'} flex h-5 w-5 shrink-0 items-center justify-center`}>{item.icon}</span>
                {!isSidebarCollapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`${isSidebarCollapsed ? 'p-3' : 'p-4'} border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300`}>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors`}
          >
            <LayoutDashboard size={20} className="rotate-180" />
            {!isSidebarCollapsed && 'Sign Out'}
          </button>
          {!isSidebarCollapsed && <div className="mt-4 px-4 text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
            EPMS v1.0 • 2026
          </div>}
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
